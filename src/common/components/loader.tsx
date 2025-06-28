import { LoaderIcon } from "lucide-react";


export default function Loader() {
  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <LoaderIcon className="animate-spin h-10 w-10" />
      </div>
    </>
  )
}
