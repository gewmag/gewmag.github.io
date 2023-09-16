import React, { useState } from "react";
import { Button, Label, TextInput } from "flowbite-react";
import { writeContract } from "@wagmi/core";
import ElectionJSON from "../abis/Election.json";
import { useAccount } from "wagmi";
import NextStageButton from "./NextStageButton";
export default function CandidacyForm() {
  const account = useAccount();
  const [candidateAddress, setCandidateAddress] = useState("");
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  //εκτελείται όταν πατιέται το declare candidacy
  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Κάλεσε τη μέθοδο "declareCandidacy" του συμβολαίου και γράψε  τη διεύθυνση του υποψηφίου
      await writeContract({
        address: `0x${ElectionJSON.address}`,
        abi: ElectionJSON.abi,

        functionName: "declareCandidacy",
        args: [candidateAddress],
      });
      setSuccess("Candidacy declared successfully");
      // Clear input field μετά submission
      setCandidateAddress("");
    } catch (error) {
      setError("Error declaring candidacy: " + error);
      console.log("Error declaring candidacy:", error);
    }
  };
  const owner = localStorage.getItem("owner");
  return (
    <>
      {owner !== account.address ? (
        <form
          className="flex flex-col max-w-md gap-4"
          onSubmit={handleCandidateSubmit}
        >
          <div className="block mb-2">
            <Label htmlFor="candidateAddress" value="Candidate Address" />
          </div>
          <TextInput
            id="candidateAddress"
            placeholder="0x..."
            required
            type="text"
            value={candidateAddress}
            onChange={(e) => setCandidateAddress(e.target.value)}
          />
          <Button color="dark" type="submit">Declare Candidacy</Button>
          {success && <div className="text-green-600">{success}</div>}
            {error && <div className="text-red-600">{error}</div>}
        </form>
      ) : (
        <div>
          {" "}
          <p className="w-auto h-auto m-auto align-middle self-justify p-auto">owner cannot declare candidacy </p>
          <NextStageButton />
        </div>
      )}{" "}
    </>
  );
}
