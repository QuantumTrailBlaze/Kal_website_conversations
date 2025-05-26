const MAX_RECENT_FILES_TO_DISPLAY = 5;

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  NotebookText,
  VideoIcon,
  ExternalLink,
  AlertCircle,
  FileArchive,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, API_AUTH, SUPABASE_CONFIG } from '@/config';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Shadcn/ui component imports
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Toast hook import
import { toast } from "@/hooks/use-toast";

// Utility Functions
const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// TypeScript Interfaces
interface UserFileMetadataError {
  message?: string;
}

interface UserFileMetadata {
  error?: UserFileMetadataError | string;
  title?: string;
  author?: string;
  document_summary?: string; 
  thumbnailUrl?: string;
  pageCount?: number;
  duration?: number;
}

export interface UserFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  rag_status: 'pending_indexing' | 'indexed' | 'error_indexing' | 'deleting' | 'error_deleting' | 'archived';
  user_id: string;
  metadata?: UserFileMetadata;
}

export const FileMgmtWidget = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [totalFilesCount, setTotalFilesCount] = useState<number | null>(null);
  const [totalBucketSizeInBytes, setTotalBucketSizeInBytes] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePopoverFileId, setActivePopoverFileId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }, []);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!user) {
      setFiles([]);
      setTotalFilesCount(null);
      setTotalBucketSizeInBytes(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const apiUrl = `${API_ENDPOINTS.fileManagerApi}/api/users/${user.id}/files`;
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 204) { 
        setFiles([]);
        setTotalFilesCount(0);
        setTotalBucketSizeInBytes(0);
      } else if (response.ok) {
        const data: UserFile[] = await response.json();
        
        const calculatedTotalSize = data.reduce((sum, file) => sum + (file.file_size || 0), 0);
        setTotalBucketSizeInBytes(calculatedTotalSize);

        const sortedFiles = data.sort((a, b) => 
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        setFiles(sortedFiles.slice(0, MAX_RECENT_FILES_TO_DISPLAY));
        setTotalFilesCount(sortedFiles.length); 
      } else {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.text(); 
          errorMessage += `. ${errorBody}`;
        } catch (e) { /* Failed to parse error body */ }
        setError(errorMessage);
        setFiles([]);
        setTotalFilesCount(null);
        setTotalBucketSizeInBytes(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching files.');
      setFiles([]);
      setTotalFilesCount(null);
      setTotalBucketSizeInBytes(null);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, setFiles, setTotalFilesCount, setTotalBucketSizeInBytes]);

  const handleDeleteFile = useCallback(async (fileId: string, fileName: string) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }

    const apiUrl = `${API_ENDPOINTS.fileManagerApi}/api/files/${fileId}?user_id=${user.id}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
        },
      });

      if (response.ok || response.status === 204) {
        toast({
          title: "Success",
          description: `File "${fileName}" has been scheduled for deletion.`,
        });
        
        setActivePopoverFileId(null);
        await fetchFiles(); 
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Failed to delete file. Unknown error." }));
        toast({
          title: "Error Deleting File",
          description: errorData.detail || `Server responded with status ${response.status}.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Deleting File",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }, [user, fetchFiles, setActivePopoverFileId]);


  const getFileIcon = (fileType: string, fileName: string): JSX.Element => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5 text-sky-500 flex-shrink-0" />;
    if (fileType.startsWith('video/')) return <VideoIcon className="h-5 w-5 text-purple-500 flex-shrink-0" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />;
    if (fileType.includes('word') || ext === 'docx' || ext === 'doc') return <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    if (fileType.includes('text') || ext === 'txt') return <NotebookText className="h-5 w-5 text-gray-500 flex-shrink-0" />;
    if (ext === 'zip' || ext === 'rar') return <FileArchive className="h-5 w-5 text-yellow-600 flex-shrink-0" />;
    return <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
  };

  const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<UserFile>) => {
    console.log('FileMgmtWidget: Realtime event:', payload.eventType, payload);
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setFiles(currentFiles => {
      let updatedFiles = [...currentFiles];
      if (eventType === 'INSERT') {
        const insertedFile = newRecord as UserFile;
        if (insertedFile && !updatedFiles.find(f => f.id === insertedFile.id)) {
          updatedFiles.unshift(insertedFile); 
        }
      } else if (eventType === 'UPDATE') {
        const updatedFile = newRecord as UserFile;
        if (updatedFile) {
            const index = updatedFiles.findIndex(f => f.id === updatedFile.id);
            if (index !== -1) {
              updatedFiles[index] = { ...updatedFiles[index], ...updatedFile };
            } else {
              updatedFiles.unshift(updatedFile);
            }
        }
      } else if (eventType === 'DELETE') {
        const deletedFileId = (oldRecord as Partial<UserFile>)?.id;
        if (deletedFileId) {
          updatedFiles = updatedFiles.filter(f => f.id !== deletedFileId);
        }
      }
      updatedFiles.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      return updatedFiles.slice(0, MAX_RECENT_FILES_TO_DISPLAY);
    });

    if (eventType === 'INSERT') {
        const insertedFile = newRecord as UserFile;
        setTotalFilesCount(currentTotal => (currentTotal !== null ? currentTotal + 1 : 1));
        if (insertedFile && typeof insertedFile.file_size === 'number') {
            setTotalBucketSizeInBytes(currentSize => 
                (currentSize !== null ? currentSize + insertedFile.file_size : insertedFile.file_size)
            );
        }
    } else if (eventType === 'DELETE') {
        const deletedFile = oldRecord as UserFile;
        setTotalFilesCount(currentTotal => (currentTotal !== null && currentTotal > 0 ? currentTotal - 1 : 0));
        if (deletedFile && typeof deletedFile.file_size === 'number') { 
            setTotalBucketSizeInBytes(currentSize => 
                (currentSize !== null ? Math.max(0, currentSize - deletedFile.file_size) : null)
            );
        }
    }
  };

  useEffect(() => {
    if (channelRef.current) {
      const previousChannelTopic = channelRef.current.topic;
      supabase.removeChannel(channelRef.current)
        .then(() => console.log(`FileMgmtWidget: Unsubscribed from previous channel ${previousChannelTopic}.`))
        .catch(err => console.error(`FileMgmtWidget: Error unsubscribing from channel ${previousChannelTopic}`, err));
      channelRef.current = null;
    }

    fetchFiles(); 

    if (!user) {
      return;
    }

    const channelName = `user_files_widget_${user.id.replace(/-/g, '')}`;
    const newChannel = supabase.channel(channelName);
    channelRef.current = newChannel;

    newChannel.on<UserFile>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_files', filter: `user_id=eq.${user.id}` },
      (payload) => handleRealtimeUpdate(payload)
    ).subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`FileMgmtWidget: Successfully subscribed to ${channelName}.`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`FileMgmtWidget: Channel error for ${channelName}.`, err);
        setError(prevError => {
          const newError = `Supabase channel error: ${err?.message || 'Unknown channel error'}`;
          return prevError ? `${prevError}\n${newError}` : newError;
        });
      } else if (status === 'TIMED_OUT') {
        console.error(`FileMgmtWidget: Subscription timed out for ${channelName}.`);
         setError(prevError => {
          const newError = 'Supabase subscription timed out.';
          return prevError ? `${prevError}\n${newError}` : newError;
        });
      } else if (status === 'CLOSED') {
        console.log(`FileMgmtWidget: Channel ${channelName} closed.`);
      }
    });

    return () => {
      if (channelRef.current) { 
        const currentChannelTopic = channelRef.current.topic;
        supabase.removeChannel(channelRef.current)
          .then(() => console.log(`FileMgmtWidget: Unsubscribed from ${currentChannelTopic} on cleanup.`))
          .catch(e => console.error(`FileMgmtWidget: Error unsubscribing from ${currentChannelTopic} on cleanup`, e));
        channelRef.current = null;
      }
    };
  }, [user, supabase, fetchFiles]); 

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">My Files</CardTitle>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/files" aria-label="Manage All Files">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" tabIndex={-1}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent className="z-50 bg-background border text-foreground rounded-md shadow-lg">
              <p>Manage All Files</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="pt-4 flex-grow flex flex-col">
        {loading ? (
          <div className="space-y-2 flex-grow flex flex-col justify-center">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-1 flex-grow">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Could not load files.
            </p>
          </div>
        ) : !user ? (
          <div className="h-full flex justify-center items-center flex-grow">
            <p className="text-sm text-muted-foreground text-center px-4">Sign in to see your files.</p>
          </div>
        ) : files.length === 0 && totalFilesCount === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-2 flex-grow">
            <p className="text-sm font-medium">No Files Yet</p>
            <p className="text-xs text-muted-foreground">
              Files you send to Kal will appear here and in "Manage All Files".
            </p>
          </div>
        ) : (
          <>
            {/* Summary line for file count and total size */}
            {totalFilesCount !== null && totalFilesCount > 0 && !loading && !error && user && (
              <p className="text-xs text-muted-foreground mb-2 px-1">
                {totalFilesCount} file{totalFilesCount !== 1 ? 's' : ''}
                {totalBucketSizeInBytes !== null && totalBucketSizeInBytes > 0 && (
                  ` (${formatFileSize(totalBucketSizeInBytes)} total)`
                )}
              </p>
            )}
            
             {files.length === 0 && totalFilesCount !== null && totalFilesCount > 0 && (
                <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-2 flex-grow">
                    <p className="text-sm text-muted-foreground">No recent files to display.</p>
                    <p className="text-xs text-muted-foreground">
                        Older files can be found in "Manage All Files".
                    </p>
                </div>
            )}
            <div className="space-y-2 flex-grow">
              {files.map((file) => (
                <Popover 
                  key={file.id} 
                  open={activePopoverFileId === file.id}
                  onOpenChange={(isOpen) => {
                    if (isOpen) {
                      setActivePopoverFileId(file.id);
                    } else {
                      if (activePopoverFileId === file.id) {
                         setActivePopoverFileId(null);
                      }
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <div 
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' || e.key === ' ') { 
                           // PopoverTrigger with asChild should handle this.
                        } 
                      }}
                    >
                      {getFileIcon(file.file_type, file.file_name)}
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm truncate flex-grow min-w-0 cursor-default pr-2">{file.file_name}</p>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            align="start" 
                            className="z-50 bg-background border text-foreground rounded-md shadow-lg max-w-xs break-words"
                          >
                            <p className="font-medium">{file.file_name}</p>
                            {(file.rag_status === 'error_indexing' || file.rag_status === 'error_deleting') && file.metadata?.error && (
                              <p className="text-xs text-red-400 mt-1">
                                Error: {typeof file.metadata.error === 'string' 
                                          ? file.metadata.error 
                                          : (file.metadata.error as UserFileMetadataError)?.message || 'Details not available'}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex items-center space-x-1 text-xs ml-auto flex-shrink-0">
                        {file.rag_status === 'pending_indexing' ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                            <span className="text-amber-600 hidden sm:inline">Processing...</span>
                          </>
                        ) : file.rag_status === 'indexed' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-green-600 hidden sm:inline">Ready</span>
                          </>
                        ) : file.rag_status === 'error_indexing' ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-red-600 hidden sm:inline">Error Indexing</span>
                          </>
                        ) : file.rag_status === 'deleting' ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                            <span className="text-muted-foreground hidden sm:inline">Deleting...</span>
                          </>
                        ) : file.rag_status === 'error_deleting' ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-red-600 hidden sm:inline">Error Deleting</span>
                          </>
                        ) : file.rag_status === 'archived' ? (
                          <>
                            <Archive className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-gray-500 hidden sm:inline">Archived</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {file.rag_status ? String(file.rag_status).charAt(0).toUpperCase() + String(file.rag_status).slice(1).replace(/_/g, ' ') : 'Status Unknown'}
                          </span>
                        )}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 z-50 bg-background border text-foreground rounded-md shadow-lg p-4 space-y-3">
                    <p className="font-semibold text-base leading-tight truncate" title={file.file_name}>{file.file_name}</p>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Uploaded:</span>
                        <span>{formatRelativeDate(file.uploaded_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <div className="flex items-center space-x-1">
                          {file.rag_status === 'pending_indexing' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                              <span className="text-amber-600">Processing...</span>
                            </>
                          ) : file.rag_status === 'indexed' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-green-600">Ready</span>
                            </>
                          ) : file.rag_status === 'error_indexing' ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                              <span className="text-red-600">Error Indexing</span>
                            </>
                          ) : file.rag_status === 'deleting' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                              <span className="text-muted-foreground">Deleting...</span>
                            </>
                          ) : file.rag_status === 'error_deleting' ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                              <span className="text-red-600">Error Deleting</span>
                            </>
                          ) : file.rag_status === 'archived' ? (
                            <>
                              <Archive className="h-3.5 w-3.5 text-gray-500" />
                              <span className="text-gray-500">Archived</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {file.rag_status ? String(file.rag_status).charAt(0).toUpperCase() + String(file.rag_status).slice(1).replace(/_/g, ' ') : 'Status Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {file.metadata?.document_summary && (
                      <div className="pt-2 border-t border-border/50">
                        <h4 className="text-sm font-medium mb-1">Summary</h4>
                        <p className="text-xs text-muted-foreground max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
                          {file.metadata.document_summary}
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/50 flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="z-[60]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the file
                              <span className="font-semibold"> "{file.file_name}"</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteFile(file.id, file.file_name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
