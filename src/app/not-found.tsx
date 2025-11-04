import { NotFoundComponent, Illustration } from "@/components/ui/not-found-component"

export default function NotFound() {
  return (
    <div className="relative flex flex-col w-full min-h-screen bg-black">
      <div className="relative flex flex-col justify-center items-center flex-1 p-6 md:p-10">
        <div className="relative max-w-5xl mx-auto w-full flex flex-col items-center">
          <Illustration className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl opacity-[0.08] text-white z-0" />
          <NotFoundComponent
            title="Página não encontrada"
            description="A página que você está procurando não existe ou foi movida."
          />
        </div>
      </div>
    </div>
  )
}

