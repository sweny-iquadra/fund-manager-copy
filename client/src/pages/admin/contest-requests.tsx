import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Eye, Calendar, DollarSign, Users } from "lucide-react";

interface ContestRequest {
  id: number;
  adminId: string;
  contestName: string;
  modeId: number;
  categoryId: number;
  contestType: string;
  entryFee: string;
  prizePool: string;
  maxParticipants?: number;
  openDate: string;
  closeDate: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContestRequests() {
  const [selectedRequest, setSelectedRequest] = useState<ContestRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  // Fetch contest requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/admin/contest-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/contest-requests");
      if (!response.ok) {
        throw new Error("Failed to fetch contest requests");
      }
      return response.json() as Promise<ContestRequest[]>;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/contest-requests/${id}/approve`, {
        notes,
      });
      if (!response.ok) {
        throw new Error("Failed to approve request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contest-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      toast({
        title: "Success",
        description: "Contest request approved successfully!",
      });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  // Deny mutation
  const denyMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/contest-requests/${id}/deny`, {
        notes,
      });
      if (!response.ok) {
        throw new Error("Failed to deny request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contest-requests"] });
      toast({
        title: "Success",
        description: "Contest request denied.",
      });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deny request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    }
  };

  const handleDeny = () => {
    if (selectedRequest) {
      denyMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const filteredRequests = requests?.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contest Requests</h1>
          <p className="text-gray-600">Review and approve contest creation requests from users</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({requests?.filter(r => r.status === 'pending').length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({requests?.filter(r => r.status === 'approved').length || 0})
            </TabsTrigger>
            <TabsTrigger value="denied">
              Denied ({requests?.filter(r => r.status === 'denied').length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">All ({requests?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                  <p className="text-gray-500 text-center">
                    {activeTab === 'pending' 
                      ? "No pending contest requests at the moment."
                      : `No ${activeTab} requests found.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg truncate">{request.contestName}</CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted {formatDate(request.createdAt)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <Badge variant="outline" className="capitalize">{request.contestType}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />Entry Fee:
                          </span>
                          <span className="font-medium">{formatCurrency(request.entryFee)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />Prize Pool:
                          </span>
                          <span className="font-medium">{formatCurrency(request.prizePool)}</span>
                        </div>

                        {request.maxParticipants && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center">
                              <Users className="w-3 h-3 mr-1" />Max Participants:
                            </span>
                            <span className="font-medium">{request.maxParticipants}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />Start Date:
                          </span>
                          <span className="font-medium">{new Date(request.startDate).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />End Date:
                          </span>
                          <span className="font-medium">{new Date(request.endDate).toLocaleDateString()}</span>
                        </div>

                        {request.reviewNotes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <div className="font-medium text-gray-700 mb-1">Review Notes:</div>
                            <div className="text-gray-600">{request.reviewNotes}</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {setSelectedRequest(request); setReviewNotes(request.reviewNotes || "");}}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Contest Request Details</DialogTitle>
                              <DialogDescription>
                                Review the contest request and approve or deny it.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Contest Name</Label>
                                    <p className="text-sm text-gray-600 mt-1">{selectedRequest.contestName}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Type</Label>
                                    <p className="text-sm text-gray-600 mt-1 capitalize">{selectedRequest.contestType}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Entry Fee</Label>
                                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(selectedRequest.entryFee)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Prize Pool</Label>
                                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(selectedRequest.prizePool)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Open Date</Label>
                                    <p className="text-sm text-gray-600 mt-1">{formatDate(selectedRequest.openDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Close Date</Label>
                                    <p className="text-sm text-gray-600 mt-1">{formatDate(selectedRequest.closeDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Start Date</Label>
                                    <p className="text-sm text-gray-600 mt-1">{formatDate(selectedRequest.startDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">End Date</Label>
                                    <p className="text-sm text-gray-600 mt-1">{formatDate(selectedRequest.endDate)}</p>
                                  </div>
                                  {selectedRequest.maxParticipants && (
                                    <div>
                                      <Label className="text-sm font-medium">Max Participants</Label>
                                      <p className="text-sm text-gray-600 mt-1">{selectedRequest.maxParticipants}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="review-notes" className="text-sm font-medium">
                                    Review Notes {selectedRequest.status === 'pending' ? '(Optional)' : ''}
                                  </Label>
                                  <Textarea
                                    id="review-notes"
                                    placeholder="Add any notes about this request..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                    disabled={selectedRequest.status !== 'pending'}
                                  />
                                </div>
                              </div>
                            )}

                            <DialogFooter className="gap-2">
                              {selectedRequest?.status === 'pending' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    onClick={handleDeny}
                                    disabled={denyMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Deny Request
                                  </Button>
                                  <Button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve Request
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  {selectedRequest?.reviewedAt && (
                                    <span>Reviewed on {formatDate(selectedRequest.reviewedAt)}</span>
                                  )}
                                </div>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                denyMutation.mutate({ id: request.id });
                              }}
                              disabled={denyMutation.isPending}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                approveMutation.mutate({ id: request.id });
                              }}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}