import { Navbar } from '@/components/Navbar';
/*import { BottomNav } from '@/components/BottomNav';*/

const RecommendationsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-24 px-4">
         <div className="container max-w-7xl">
            <h1 className="text-3xl font-bold mb-4">Book Recommendations</h1>
            {/* Content will be added later */}
            <p className="text-muted-foreground">Full list of book recommendations will appear here.</p>
         </div>
      </main>
			{/*} <BottomNav />*/}
    </div>
  );
};

export default RecommendationsPage;
