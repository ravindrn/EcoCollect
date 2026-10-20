import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { login } from '../services/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      navigate('/')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sign-in failed')
    }
  })

  return (
    <main>
      <h1>Admin sign in</h1>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" {...register('email')} />
        </label>
        <p>{formState.errors.email?.message}</p>

        <label>
          Password
          <input type="password" {...register('password')} />
        </label>
        <p>{formState.errors.password?.message}</p>

        {formError ? <p>{formError}</p> : null}
        <button type="submit">Sign in</button>
      </form>
    </main>
  )
}