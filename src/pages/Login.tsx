import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router';
import { useUserStore } from '@/stores/useUserStore';
import client from '@/api/client';
import { toast } from 'sonner';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const login = useUserStore((state) => state.login);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data: any) => {
    try {
      setServerError('');
      const res: any = await client.post('/auth/login', data);
      if (res.code === 200) {
        login(res.data.token, res.data.user);
        toast.success('登录成功');
        navigate('/');
      }
    } catch (err: any) {
      setServerError(err.message || '登录失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或者{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              注册新账号
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
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
                autoComplete="current-password"
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="密码"
                {...register('password', { required: '请输入密码' })}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
            </div>
          </div>

          {serverError && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                记住我
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                忘记密码?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
