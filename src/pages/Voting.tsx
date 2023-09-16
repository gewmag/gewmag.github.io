import React, { useState, useEffect } from "react";
import { Button, Label, Select } from "flowbite-react";
import { writeContract, readContract } from "@wagmi/core";
import ElectionJSON from "../abis/Election.json";
import { useAccount } from "wagmi";
import NextStageButton from "./NextStageButton";
export default function VotingForm() {
  const account = useAccount();
  const [candidatesList, setCandidatesList] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCandidatesList();
  }, []);
//λήψη της λίστας των υποψηφίων από το συμβόλαιο
  const fetchCandidatesList = async () => {
    let candidates = [];
    let i = 0;

    while (true) {
      try {
        const candidate = (await readContract({
          address: `0x${ElectionJSON.address}`,
          abi: ElectionJSON.abi,
          functionName: "candidates",
          args: [i],
        })) as string;

        candidates.push(candidate);
        i++;
      } catch (error) {
        // Έξοδος από τον βρόγχο εάν προκύψει σφάλμα (τέλος της λίστας των υποψηφίων)
        break;
      }
    }
//Ορισμός της λίστας των υποψηφίων στο state
    setCandidatesList(candidates);
  };
//εκτελείται όταν πατιέται το vote
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
       //Κάλεσε τη μέθοδο "vote" του συμβολαίου και ψήφισε τον επιλεγμένο υποψήφιο
      await writeContract({
        address: `0x${ElectionJSON.address}`,
        abi: ElectionJSON.abi,
        functionName: "vote",
        args: [selectedCandidate],
      });
 // Clear το selection μετά την υποβολή     
      setSelectedCandidate("");
      setSuccess("Voted successfully");
    } catch (error) {
      console.log("Error voting:", error);
      setError("Error voting: " + error);
    }
  };
  const owner = localStorage.getItem("owner");
  return (
    <>
      {owner !== account.address ? (// Έλεγχος οτι ο τρέχων χρήστης δεν είναι ο ιδιοκτήτης
        <form
          className="flex flex-col max-w-md gap-4 !p-0 !m-0 align-middle self-justify p-auto"
          onSubmit={handleVoteSubmit}
        >
          <div className="block mb-2">
            <Label htmlFor="selectedCandidate" value="Select a Candidate" />
          </div>
          <Select
            id="selectedCandidate"
            required
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
          >
            <option value="">Select a candidate</option>
            {candidatesList.map((candidate, index) => (
              <option key={index} value={candidate}>
                {candidate}
              </option>
            ))}
          </Select>
          <Button color="success" type="submit">Vote</Button>
          <br/>
          {success && <div className="text-green-600">{success}</div>}
          {error && <div className="text-red-600">{error}</div>}
        </form>
      ) : (
        <div>
          {" "}
          <p className="w-auto h-auto m-auto align-middle self-justify p-auto">
            owner cannot vote{" "}
          </p>
          <NextStageButton />
        </div>
      )}
    </>
  );
}
