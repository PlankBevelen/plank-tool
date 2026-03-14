import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router';
import { useUserStore } from '@/stores/useUserStore';
import client from '@/api/client';
import { toast } from 'sonner';

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterResponse = {
  code: number;
  data: {
    token: string;
    user: {
      username: string;
      email: string;
      role: string;
      favorites?: string[];
    };
  };
};

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>();
  const login = useUserStore((state) => state.login);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError('');
      const res = await client.post('/auth/register', data) as unknown as RegisterResponse;
      if (res.code === 201) {
        login(res.data.token, res.data.user);
        toast.success('注册成功');
        navigate('/');
      }
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err && 'message' in err ? String((err as { message?: unknown }).message) : '注册失败');
      setServerError(message);
    }
  };

  const password = watch('password', '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              直接登录
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${errors.username ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="用户名"
                {...register('username', { 
                  required: '请输入用户名',
                  minLength: { value: 3, message: '用户名至少3个字符' }
                })}
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message as string}</p>}
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="邮箱地址"
                {...register('email', { 
                  required: '请输入邮箱',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "邮箱格式不正确"
                  }
                })}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="密码"
                {...register('password', { 
                  required: '请输入密码',
                  minLength: { value: 6, message: '密码至少6个字符' }
                })}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="确认密码"
                {...register('confirmPassword', { 
                  required: '请确认密码',
                  validate: value => value === password || "两次输入的密码不一致"
                })}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message as string}</p>}
            </div>
          </div>

          {serverError && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {serverError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
