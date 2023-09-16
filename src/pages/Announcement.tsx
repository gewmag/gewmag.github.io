import { useEffect, useState } from "react";
import { Card } from "flowbite-react";
import { readContracts, readContract, writeContract } from "@wagmi/core";
import ElectionJSON from "../abis/Election.json";
import NextStageButton from "./NextStageButton";
import { Button } from "flowbite-react";
import { useAccount } from "wagmi";
export default function ResultsCard() {
  const [electionData, setElectionData] = useState<any>({
    candidates: [],
    currentStage: "",
    currentWinner: "",
    electionId: "",
    owner: "",
    registeredVotersCount: 0,
    registeredVoters: [],
  });
  const [stage, setStage] = useState<number>(0);
  const address = useAccount().address;
   //ανακοίνωση του νικητή των εκλογών
  async function announceWinner() {
    await writeContract({
      address: `0x${ElectionJSON.address}`,
      abi: ElectionJSON.abi,
      functionName: "announceWinner",
    });
  }
//επανεκκίνηση των εκλογών
  async function restartElections() {
    await writeContract({
      address: `0x${ElectionJSON.address}`,
      abi: ElectionJSON.abi,
      functionName: "restartElections",
    });
  }

  useEffect(() => {
    //Κλήση της λήψης των δεδομένων των εκλογών
    async function fetchElectionData() {
      try {
         //Διάβασμα του τρέχοντος σταδίου 
        const currentStage = await readContract({
          address: `0x${ElectionJSON.address}`,
          abi: ElectionJSON.abi,
          functionName: "currentStage",
        });
        setStage(currentStage as number);
 //Διάβασμα των δεδομένων των εκλογών από το συμβόλαιο
        const data: any = (await readContracts({
          contracts: [
            {
              address: `0x${ElectionJSON.address}`,
              abi: ElectionJSON.abi as any,
              functionName: "candidates",
            },
            {
              address: `0x${ElectionJSON.address}`,
              abi: ElectionJSON.abi,
              functionName: "currentStage",
            },
            {
              address: `0x${ElectionJSON.address}`,
              abi: ElectionJSON.abi,
              functionName: "currentWinner",
            },
            {
              address: `0x${ElectionJSON.address}`,
              abi: ElectionJSON.abi,
              functionName: "electionId",
            },
            {
              address: `0x${ElectionJSON.address}`,
              abi: ElectionJSON.abi,
              functionName: "owner",
            },
            {
              address: `0x${ElectionJSON.address}`,
              abi: ElectionJSON.abi,
              functionName: "getRegisteredVotersCount",
            },
          ],
        })) as any[];

        const registeredVotersCount = parseInt(data[5].result, 10);
        const registeredVotersPromises = [];

        for (let i = 0; i < registeredVotersCount; i++) {
          registeredVotersPromises.push(
            readContracts({
              contracts: [
                {
                  address: `0x${ElectionJSON.address}`,
                  abi: ElectionJSON.abi as any,
                  functionName: "registeredVoters",
                  args: [i],
                },
              ],
            })
          );
        }

        const registeredVotersData = await Promise.all(
          registeredVotersPromises
        );
        console.log("Election data:", data);
        // Ορισμός των δεδομένων των εκλογών στο state
        setElectionData({
          candidates: data[0].result,
          currentStage: data[1].result,
          currentWinner: data[2].result,
          electionId: Number(data[3].result),
          owner: data[4].result,
          registeredVotersCount,
          registeredVoters: registeredVotersData.map(
            (item: any) => item[0].result
          ),
        });
      } catch (error) {
        console.log("Error fetching election data:", error);
      }
    }

    fetchElectionData();
  }, []);

  return (
    <>
      <div className="flex items-center justify-center ">
        <Card
          className="w-full max-w-md"
          renderImage={() => (
            <img
              width={500}
              height={500}
              src="https://www.lboro.ac.uk/media/wwwlboroacuk/external/content/mediacentre/pressreleases/2020/11/emotive-us-election.jpg" alt=""
            />
          )}
        >
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Election Results to be announced shortly
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            <strong>Election ID:</strong> {electionData.electionId}
            <br />
            <strong>Owner:</strong> {electionData.owner}
            <br />
            <strong>Number of Registered Voters:</strong>{" "}
            {electionData.registeredVotersCount}
            <br />
            <strong>Registered Voters:</strong>{" "}
            {electionData.registeredVoters.join(", ")}
          </p>
        </Card>
      </div>
      <div className="top-0 bottom-[100vh]">
        <NextStageButton />
        <br />
        <br />
        {localStorage.getItem("owner") === address ? (
          <>
            <Button
              className="absolute bottom-0 right-0 p-2 mr-4 text-white rounded"
              color="warning"
              disabled={stage !== 3}
              onClick={() => announceWinner()}
            >
              {" "}
              Announce Winner{" "}
            </Button>
            <Button
              className="absolute bottom-0 right-0 p-2 mr-4 text-white rounded bottom-20"
              color="success"
              disabled={stage !== 4}
              onClick={() => restartElections()}
            >
              {" "}
              Restart Elections{" "}
            </Button>
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
