"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, Users, Send, Bot, Sparkles, Briefcase } from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumes, setResumes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isFetchingInterns, setIsFetchingInterns] = useState(false);
  // State for managing selected candidates
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const selectAllRef = useRef(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // This function correctly handles multiple files by converting the FileList to an array.
  const handleResumeUpload = (event) => {
    if (event.target.files) {
      setResumes(Array.from(event.target.files));
    }
  };

  const handleProcessResumes = async () => {
    if (!jobDescription || resumes.length === 0) {
      alert("Please provide a job description and upload resumes.");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    resumes.forEach(file => {
      formData.append("resumes", file); // The key is "resumes" for each file
    });

    const N8N_PROCESSING_URL = "http://localhost:5678/webhook/multipart/form-data";

    try {
      const response = await fetch(N8N_PROCESSING_URL, {
        method: "POST",
        body: formData,
      });
      const responseData = await response.json();

      console.log("Data received from n8n:", responseData);

      let candidatesArray = [];
      if (Array.isArray(responseData)) {
        // If n8n returns an array of candidates, use it directly
        candidatesArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // If n8n returns a single candidate object, wrap it in an array
        candidatesArray = [responseData];
      }
      
      setCandidates(candidatesArray);
      setSelectedCandidates(new Set()); // Clear previous selections

    } catch (error) {
      console.error("Error processing resumes:", error);
      alert("Failed to process resumes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchInterns = async () => {
    setIsFetchingInterns(true);
    setCandidates([]); // Clear existing candidates
    setSelectedCandidates(new Set());

    // Your n8n webhook should accept jobDescription and return only relevant interns
    const N8N_INTERN_URL = "http://localhost:5678/webhook/view-interns";

    try {
      const response = await fetch(N8N_INTERN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }), // Send the job description for matching
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const internData = await response.json();
      console.log("Intern data received from n8n:", internData);

      let candidatesArray = [];
      if (Array.isArray(internData)) {
        candidatesArray = internData;
      } else if (internData && typeof internData === 'object') {
        candidatesArray = [internData];
      }
      
      setCandidates(candidatesArray);

    } catch (error) {
      console.error("Error fetching interns:", error);
      alert("Failed to fetch intern data.");
    } finally {
      setIsFetchingInterns(false);
    }
  };

  const handleAutonomousSelection = async () => {
    if (candidates.length === 0) {
      alert("Please process candidates first.");
      return;
    }
    // Only send selected candidates
    const selected = candidates.filter((candidate, idx) =>
      selectedCandidates.has(getCandidateKey(candidate, idx))
    );
    if (selected.length === 0) {
      alert("Please select at least one candidate.");
      return;
    }
    setIsScheduling(true);
    const N8N_SCHEDULING_URL = "http://localhost:5678/webhook/schedule-interviews";
    try {
      const response = await fetch(N8N_SCHEDULING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: selected, jobDescription }),
      });
      const result = await response.json();
      alert(result.message || "Scheduling process initiated successfully!");
    } catch (error) {
      console.error("Error initiating scheduling:", error);
      alert("Failed to initiate scheduling.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Helper to get unique key for a candidate
  const getCandidateKey = (candidate, idx) =>
    candidate.id || (candidate.email + '-' + candidate.score + '-' + idx);

  // Update handleSelectionChange to accept the key
  const handleSelectionChange = (candidateKey) => {
    const newSelection = new Set(selectedCandidates);
    if (candidateKey === 'all') {
      if (selectedCandidates.size === candidates.length) {
        newSelection.clear(); // Deselect all
      } else {
        candidates.forEach((c, idx) => newSelection.add(getCandidateKey(c, idx))); // Select all
      }
    } else {
      if (newSelection.has(candidateKey)) {
        newSelection.delete(candidateKey);
      } else {
        newSelection.add(candidateKey);
      }
    }
    setSelectedCandidates(newSelection);
  };

  const handleScheduleConfirm = async () => {
    if (!meetingDate || !meetingTime) {
      alert("Please select both date and time.");
      return;
    }
    const selected = candidates.filter((candidate, idx) =>
      selectedCandidates.has(getCandidateKey(candidate, idx))
    );
    if (selected.length === 0) {
      alert("Please select at least one candidate.");
      return;
    }
    // Compute AM/PM
    const [hourStr] = meetingTime.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    setIsScheduling(true);
    setSuccessMessage('');
    const N8N_SCHEDULING_URL = "http://localhost:5678/webhook/schedule-interviews";
    try {
      const response = await fetch(N8N_SCHEDULING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: selected,
          jobDescription,
          meetingDate,
          meetingTime,
          ampm, // <-- send AM/PM info
        }),
      });
      const result = await response.json();
      setShowScheduleModal(false);
      setSuccessMessage(result.message || "Successfully appointed meeting!");
    } catch (error) {
      console.error("Error initiating scheduling:", error);
      alert("Failed to initiate scheduling.");
    } finally {
      setIsScheduling(false);
    }
  };

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedCandidates.size > 0 &&
        !candidates.every((c, idx) => selectedCandidates.has(getCandidateKey(c, idx)));
    }
  }, [selectedCandidates, candidates]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <>
      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          /* Makes the icon white on dark backgrounds */
        }
      `}</style>
      <div className="dark min-h-screen w-full bg-black text-white p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="text-center py-4">
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-600 bg-opacity-100">
              AUTONOMUS HR AGENT CO-PILLOT
            </h1>
            <p className="mt-5 text-lg text-neutral-400">
              Welcome to the future of HR management.
            </p>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* --- Job Description and Resume Upload Cards (Unchanged) --- */}
              <Card className="bg-black/30 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText /> Job Description</CardTitle>
                  <CardDescription>Provide the JD to match candidates against.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="min-h-[250px] bg-neutral-900/50 border-neutral-700"
                  />
                </CardContent>
              </Card>
              <Card className="bg-black/30 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Upload /> Upload Resumes</CardTitle>
                  <CardDescription>Upload multiple resumes (.pdf, .docx).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="file"
                    multiple
                    onChange={handleResumeUpload}
                    className="file:text-white"
                  />
                  {resumes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-neutral-300">Selected Files:</p>
                      <ul className="list-disc list-inside text-sm text-neutral-400 max-h-24 overflow-y-auto rounded-md border border-neutral-800 p-2">
                        {resumes.map((file, index) => (
                          <li key={index} className="truncate">{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Button onClick={handleProcessResumes} className="w-full text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300" size="lg" disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? "Analyzing..." : "Generate Candidate Rankings"}
              </Button>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-black/30 backdrop-blur-lg border-neutral-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Users /> Candidate Review Panel</CardTitle>
                      <CardDescription>Candidates are ranked based on their match to the job description.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleFetchInterns} disabled={isFetchingInterns}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      {isFetchingInterns ? "Fetching..." : "View Interns"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Header with select all */}
                    {candidates.length > 0 && (
                      <div className="flex items-center p-3 rounded-md border border-neutral-800 bg-neutral-900/30">
                        <Checkbox
                          id="select-all"
                          ref={selectAllRef}
                          checked={
                            candidates.length > 0 &&
                            candidates.every((c, idx) => selectedCandidates.has(getCandidateKey(c, idx)))
                          }
                          onCheckedChange={() => handleSelectionChange('all')}
                          aria-label="Select all candidates"
                        />
                        <label htmlFor="select-all" className="ml-3 text-sm font-medium text-white">
                          Select All Candidates
                        </label>
                      </div>
                    )}

                    {/* List of candidates */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700 hover:scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
                      {candidates.length > 0 ? (
                        candidates.map((candidate, idx) => {
                          const candidateKey = getCandidateKey(candidate, idx);
                          return (
                            <div 
                              key={candidateKey}
                              className={`p-4 rounded-lg border transition-colors ${selectedCandidates.has(candidateKey) ? 'bg-neutral-800 border-blue-500' : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'}`}
                            >
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={selectedCandidates.has(candidateKey)}
                                  onCheckedChange={() => handleSelectionChange(candidateKey)}
                                  aria-label={`Select ${candidate.name}`}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-bold text-lg text-white">{candidate.name}</h3>
                                      <p className="text-sm text-neutral-400">{candidate.email}</p>
                                    </div>
                                    <div className="text-center pl-4">
                                      <p className="text-xs text-neutral-400">Score</p>
                                      <p className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">{candidate.score}%</p>
                                    </div>
                                  </div>
                                  <div className="mt-4 border-t border-neutral-800 pt-3">
                                    <h4 className="font-semibold text-neutral-300">AI Summary</h4>
                                    <p className="text-sm text-neutral-400 mt-1">
                                      {candidate.summary || candidate['ai summary'] || candidate['AI SUMMARY']}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-16 text-neutral-400">
                          Process resumes to see ranked candidates here.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end items-center gap-4">
                    <div className="text-sm text-neutral-400">
                      {selectedCandidates.size} of {candidates.length} selected
                    </div>
                    <Button
                      onClick={() => setShowScheduleModal(true)}
                      disabled={isScheduling || candidates.length === 0}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      {isScheduling ? "Scheduling..." : "Select Top Candidates & Schedule Interviews"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>

          {/* Schedule Confirmation Modal */}
          <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Date</label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="bg-neutral-900 text-white border border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Time</label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="bg-neutral-900 text-white border border-neutral-700 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleScheduleConfirm} disabled={isScheduling}>
                  {isScheduling ? "Scheduling..." : "Confirm & Schedule"}
                </Button>
                <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {successMessage && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in transition-opacity duration-700">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );  


}
