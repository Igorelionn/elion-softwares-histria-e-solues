"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
        },
        classNames: {
          description: 'text-gray-700',
          success: 'bg-white text-black border-green-200',
          error: 'bg-white text-black border-red-200',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
