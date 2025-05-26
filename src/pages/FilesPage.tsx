import { Navbar } from '@/components/Navbar';
//import { BottomNav } from '@/components/BottomNav';

const FilesPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-24 px-4">
         <div className="container mx-auto max-w-7xl"> {/* Added mx-auto for centering */}
            <h1 className="text-3xl font-bold mb-4">My Files</h1>
            {/* Content will be added later */}
            <p className="text-muted-foreground">Full file management interface will appear here.</p>
         </div>
      </main>
			{/*}  <BottomNav />*/}
    </div>
  );
};

export default FilesPage;
