import React, { useState, useEffect } from "react";
import { Button, Label, TextInput } from "flowbite-react";
import { readContract, writeContract } from "@wagmi/core";
import { useAccount } from "wagmi";
import ElectionJSON from "../abis/Election.json";
import {  ethers } from "ethers";
import NextStageButton from "./NextStageButton";
export default function RegistrationForm() {
  const account = useAccount();
  const [isOwner, setIsOwner] = useState<Boolean>(false);
  const [voterAddress, setVoterAddress] = useState<String>("");
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  useEffect(() => {
    async function checkOwner() {
      try {
         //Διάβασε τον ιδιοκτήτη συμβολαίου και έλεγξε αν ταιριάζει με το τρέχον λογαριασμό
        const data: any = await readContract({
          address: `0x${ElectionJSON.address}`, 
          abi: ElectionJSON.abi, 
          functionName: "owner",
        });

        setIsOwner(account.address === data);
      } catch (e) {
        console.log("Error fetching owner:", e);
      }
    }

    checkOwner();
  }, [account]);//[account]--> κάνε ξανά έλεγχο όταν αλλάξει ο λογαριασμός
//εκτελείται όταν πατιέται το κουμπί register
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
     //Έλεγξε αν η διεύθυνση ψηφοφόρου είναι έγκυρη
    if (ethers.isAddress(voterAddress)) {
      try {
        // Κάλεσε τη μέθοδο "registerVoter" του συμβολαίου και γράψε τη διεύθυνση του ψηφοφόρου 
        let { hash } = await writeContract({
          address: `0x${ElectionJSON.address}`, 
          abi: ElectionJSON.abi, 
          functionName: "registerVoter",
          args: [voterAddress],
        });
        setSuccess("Voter registered successfully" + hash);
      } catch (error) {
        setError("Error registering voter:" + error);
        console.log("Error registering voter:", error);
        
      }
    } else {
      alert("Invalid Address");
    }
  };

  return (
    <>
      <form
        className="flex flex-col justify-center max-w-xl gap-4 "
        onSubmit={handleSubmit}
      >
        <div>
          <div className="block mb-2">
            <Label htmlFor="voterAddress" value="Voter's Address" />
          </div>
          <TextInput
            id="voterAddress"
            placeholder="0x..."
            required
            onChange={(e) => setVoterAddress(e.target.value)}
            type="text"
            disabled={!isOwner}
          />
        </div>
        {isOwner ? (
          <>
            <Button color="purple" type="submit">
              Register Voter
            </Button>
            {success && <div className="text-green-600">{success}</div>}
            {error && <div className="text-red-600">{error}</div>}
          </>
        ) : (
          <div className="text-red-600">
            This action is allowed only to the admin of this contract.
          </div>
        )}
      </form>
      <NextStageButton />{" "}
    </>
  );
}
