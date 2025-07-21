import { PhotoNamer } from "@/components/photo-namer";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 relative">
       <div className="absolute top-4 right-4">
        <Button asChild variant="outline">
          <Link href="/admin">
            <User className="mr-2 h-4 w-4" />
            Admin View
          </Link>
        </Button>
      </div>
      <PhotoNamer />
    </main>
  );
}
