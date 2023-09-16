import { useState, useEffect } from "react";
import { Button } from "flowbite-react";
import { readContract, writeContract } from "@wagmi/core";
import ElectionJSON from "../abis/Election.json";
import { useAccount } from "wagmi";

export default function NextStageButton() {
  const account = useAccount();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [stage, setStage] = useState<number>(0);
  useEffect(() => {
    // Έλεγχος αν ο χρήστης είναι ο ιδιοκτήτης του συμβολαίου
    async function checkOwner() {
      try {
        const data: any = await readContract({
          address: `0x${ElectionJSON.address}`, 
          abi: ElectionJSON.abi, 
          functionName: "owner",
        });

        setIsOwner(account.address === data);

        const currentStage = await readContract({
          address: `0x${ElectionJSON.address}`,
          abi: ElectionJSON.abi,
          functionName: "currentStage",
        });
        setStage(currentStage as number);
      } catch (e) {
        console.log("Error fetching owner:", e);
      }
    }

    checkOwner();
  }, [account]);//[account]--> κάνε ξανά έλεγχο όταν αλλάξει ο λογαριασμός

  const handleNextStage = async () => {
    try {
      await writeContract({
        address: `0x${ElectionJSON.address}`,
        abi: ElectionJSON.abi,
        functionName: "nextStage",
      });
      window.location.reload();
    } catch (error) {
      console.log("Error transitioning to the next stage:", error);

    }
  };
  return (
    <div className="relative flex items-center justify-center h-[50vh]">
      {isOwner && stage < 3 ? (
        <>
          {stage < 3 ? (
            <>
              <Button
                className="absolute bottom-0 right-0 p-2 mb-4 mr-4 text-white rounded"
                color="failure"
                onClick={handleNextStage}
              >
                <p>Move to Next Stage </p>
              </Button>
            </>
          ) : (
            <div className="absolute bottom-0 right-0 p-2 mb-4 mr-4 text-red-600 rounded"></div>
          )}
        </>
      ) : (
        <div className="absolute bottom-0 right-0 p-2 mb-4 mr-4 text-red-600 rounded"></div>
      )}
    </div>
  );
}
