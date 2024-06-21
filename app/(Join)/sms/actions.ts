'use server';

import crypto from 'crypto';
import { z } from 'zod';
import validator from 'validator';
import { redirect } from 'next/navigation';
import db from '@/app/lib/db';
import getSession from '@/app/lib/session';

interface ActionState {
  token: boolean;
}

const phoneSchema = z
  .string()
  .trim()
  .refine(
    (phone) => validator.isMobilePhone(phone, 'ko-KR'),
    '번호 형식이 잘못되었습니다.'
  );

async function tokenExists(token: number) {
  const exists = await db.sMSToken.findUnique({
    where: {
      token: token.toString(),
    },
    select: {
      id: true,
    },
  });
  return Boolean(exists);
}

const tokenSchema = z.coerce
  .number()
  .min(100000)
  .max(999999)
  .refine(tokenExists, '잘못된 인증코드입니다.');

async function getToken() {
  const token = crypto.randomInt(100000, 999999).toString();
  const exists = await db.sMSToken.findUnique({
    where: {
      token,
    },
    select: {
      id: true,
    },
  });
  if (exists) {
    return getToken();
  } else {
    return token;
  }
}
export async function smsLogin(prevState: ActionState, formData: FormData) {
  const phone = formData.get('phone');
  const token = formData.get('token');
  if (!prevState.token) {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      return {
        token: false,
        error: result.error.flatten(),
      };
    } else {
      // 이전 토큰 삭제하기
      await db.sMSToken.deleteMany({
        where: {
          user: {
            phone: result.data,
          },
        },
      });
      // 새 토큰 생성하기
      const token = await getToken();
      await db.sMSToken.create({
        data: {
          token,
          user: {
            connectOrCreate: {
              where: {
                phone: result.data,
              },
              create: {
                nickname: crypto.randomBytes(10).toString('hex'),
                phone: result.data,
              },
            },
          },
        },
      });
      // twillo에 토큰 보내기
      return {
        token: true,
      };
    }
  } else {
    const result = await tokenSchema.safeParseAsync(token);
    if (!result.success) {
      return {
        token: true,
        error: result.error.flatten(),
      };
    } else {
      // userId의 토큰
      const token = await db.sMSToken.findUnique({
        where: {
          token: result.data.toString(),
        },
        select: {
          id: true,
          userId: true,
        },
      });

      const session = await getSession();
      session.id = token!.userId;
      await session.save();
      await db.sMSToken.delete({
        where: {
          id: token!.id,
        },
      });

      redirect('/profile');
    }
  }
}
