import { Navbar } from '@/components/Navbar'; // Assuming shared Navbar
// Removed: import { BottomNav } from '@/components/BottomNav';

const SchedulePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-24 px-4"> {/* Ensure pb-24 for potential BottomNav clearance if it were here */}
         <div className="container mx-auto max-w-7xl">
            <h1 className="text-3xl font-bold mb-4">Full Schedule</h1>
            {/* Content will be added later */}
            <p className="text-muted-foreground">Schedule details will appear here.</p>
         </div>
      </main>
      {/* Removed: <BottomNav /> */}
    </div>
  );
};

export default SchedulePage;
