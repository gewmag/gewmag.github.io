// Import necessary dependencies
import { readContract } from "@wagmi/core";
import { Timeline } from "flowbite-react";
import { HiCalendar } from "react-icons/hi";
import ElectionJSON from "../abis/Election.json";
import { useState, useEffect } from "react";
import NavbarWithCTAButton from "./NavbarWithDropdown";

interface ElectionResult {
  blockNumber: string;
  candidates: string[];
  electionId: string;
  timestamp: string;
  winner: string;
  winnerVotes: string;
}

export default function ElectionTimelines() {
  const [electionData, setElectionData] = useState<ElectionResult[]>([]);

  const fetchElectionData = async () => {
    try {
      //Διαβάζει τον συνολικό αριθμό των εκλογών που πραγματοποιήθηκαν
      const totalElections: number = (await readContract({
        address: `0x${ElectionJSON.address}`,
        abi: ElectionJSON.abi,
        functionName: "totalElections",
      },
      )) as number;

      const data: ElectionResult[] = [];

      for (let i = 1; i <= totalElections; i++) {
         //Διαβάζει τα αποτελέσματα της συγκεκριμένης εκλογής από το συμβόλαιο
        const electionResult = (await readContract({
          address: `0x${ElectionJSON.address}`,
          abi: ElectionJSON.abi,
          functionName: "getElectionResult",
          args: [i],
        })) as ElectionResult;
        electionResult.timestamp = new Date(
          parseInt(electionResult.timestamp) * 1000
        ).toLocaleString() as any;
        data.push(electionResult);
      }

      setElectionData(data);
    } catch (e) {
      console.log("Error fetching election data:", e);
    }
  };

  useEffect(() => {
     //Καλεί τη συνάρτηση fetchElectionData κατά τη φόρτωση του component
    fetchElectionData();
  }, []);

  return (
    <>
      <NavbarWithCTAButton />

      <div className="flex items-center justify-center h-screen">
        <Timeline>
          {electionData.map((electionResult, index) => (
            <Timeline.Item key={index}>
              <Timeline.Point icon={HiCalendar} />
              <Timeline.Content>
                <Timeline.Time>{electionResult.timestamp}</Timeline.Time>
                <Timeline.Title>
                  Election ID: {Number(electionResult.electionId)}
                </Timeline.Title> 
                <Timeline.Body>
                  Candidates: {electionResult.candidates.join(", ")}
                  <br />
                  Winning Votes: {Number(electionResult.winnerVotes)}
                  <br />
                  BlockNumber: {Number(electionResult.blockNumber)}
                  <br />
                  Winner: {electionResult.winner}
                </Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </>
  );
}
