import FormInput from '@/components/form-input';
import FormBtn from '@/components/from-btn';
import SocialLogin from '@/components/social-login';

export default function Login() {
  return (
    <div className="flex flex-col gap-10 py-8 px-6">
      <div className="flex flex-col gap-2 *:font-medium">
        <h1 className="text-2xl ">어서오세요!</h1>
        <h2 className="text-xl">
          <span className="text-orange-500">당</span>신{' '}
          <span className="text-orange-500">근</span>처의 작은 마켓에 오신 것을
          환영합니다.
        </h2>
      </div>
      <form className="flex flex-col gap-3">
        <FormInput type="email" placeholder="이메일" required errors={[]} />{' '}
        <FormInput
          type="password"
          placeholder="비밀번호"
          required
          errors={[]}
        />
        <FormBtn loading={false} text="로그인" />
      </form>
    </div>
  );
}
