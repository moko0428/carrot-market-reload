'use server';

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from '@/app/lib/constants';
import db from '@/app/lib/db';
import { z } from 'zod';
import bcrypt, { hash } from 'bcrypt';
import getSession from '@/app/lib/session';
import { redirect } from 'next/navigation';

// 유저 이메일 찾기
const checkEmailExists = async (email: string) => {
  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });
  return Boolean(user);
};

const formSchema = z.object({
  email: z
    .string()
    .email()
    .toLowerCase()
    .refine(checkEmailExists, '이 이메일을 사용하는 계정이 존재하지 않습니다.'),
  password: z
    .string({
      required_error: '비밀번호를 입력해주세요.',
    })
    .min(PASSWORD_MIN_LENGTH)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

export const login = async (prevState: any, formData: FormData) => {
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };
  const result = await formSchema.spa(data);
  if (!result.success) {
    return result.error.flatten();
  } else {
    // 비밀번호가 맞는지 확인
    const user = await db.user.findUnique({
      where: {
        email: result.data.email,
      },
      select: {
        id: true,
        password: true,
      },
    });
    const ok = await bcrypt.compare(result.data.password, user!.password ?? '');
    if (ok) {
      const session = await getSession();
      session.id = user!.id;
      await session.save();
      redirect('/profile');
    } else {
      return {
        fieldErrors: {
          password: ['잘못된 비밀번호입니다.'],
          email: [],
        },
      };
    }
    // 로그인
    // redirect
  }
  // return {
  //   errors: ['비밀번호가 틀렸습니다.', '비밀번호가 너무 짧습니다.'],
  // };
};
