'use client'
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";


const Dashboard = () => {

  const router = useRouter();

  const handleLogout = () => {
    // 1. Remove the token from client-side storage
    localStorage.removeItem('accessToken'); 

    // 2. Redirect the user
    router.push('/auth/signin'); 
  };

  return ( 
    <div className='flex flex-row justify-around'>
      Dashboard
      <div className="">
      {/* Sign In Button */}
            <Button
            onClick={handleLogout}
              type="submit"
              disabled={false}
              className="w-full h-12 px-[10px] py-[14px] bg-[#3B82F6] hover:bg-[#2663C7] [box-shadow:0px_4px_0px_0px_#2663C7] text-white font-medium rounded-lg transition-colors mt-5"
            >
              { "Logout"}
            </Button>

      </div>
    </div>
  );
}

export default Dashboard;