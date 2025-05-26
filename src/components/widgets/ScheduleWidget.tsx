import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const scheduleItems = [
  { time: '9:00 AM', event: 'Project meeting' },
  { time: '10:00 AM', event: 'Call with mentor' },
  { time: '2:00 PM', event: 'Gym' },
  { time: '4:00 PM', event: 'Review notes' },
];

export const ScheduleWidget = () => {
  return (
    <Card className="glass-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Schedule</CardTitle>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/schedule" aria-label="View full schedule">
                <Button variant="ghost" size="icon" className="h-6 w-6" tabIndex={-1}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View full schedule</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {scheduleItems.map((item, index) => (
            <li key={index} className="flex items-center text-sm">
              <span className="w-20 text-muted-foreground">{item.time}</span>
              <span>{item.event}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
