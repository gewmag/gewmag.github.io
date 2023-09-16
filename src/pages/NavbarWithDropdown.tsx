import { Navbar } from "flowbite-react";
import { Web3Button } from "@web3modal/react";
import { useEffect } from "react";
import ElectionJSON from "../abis/Election.json";
import { readContracts} from "@wagmi/core";
export default function NavbarWithCTAButton() {
  async function fetchNumbers() {
    try {
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
            functionName: "getRegisteredVotersCount",
          },
        ],
      })) as any[];

      localStorage.setItem("registeredVotersCount",data[2].result);
    } catch (error) {
      console.log("Error fetching election data:", error);
    }
  }
  useEffect(() => {
    fetchNumbers();
  }, []);
  return (
    <Navbar fluid rounded>
      <Navbar.Brand href="/" style={{padding:"10px"}}>
        <img
          alt="DApp Logo"
          className="h-6 mr-3 sm:h-9"
          src="https://imgs.search.brave.com/4DhEfCAQFCZtHQjNPNqoGqZ9Ye9ov-FD0uzpkkCSWc8/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvcHJldmll/dy0xeC82MS82Mi9s/b2dvLW9mLWV0aGVy/ZXVtLWV0aC1pY29u/LWNyeXB0b2N1cnJl/bmN5LXZlY3Rvci00/MTA1NjE2Mi5qcGc" // Replace with your DApp logo's image URL
        />
        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
          ElectionDapp
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2" >
        <div id="web3modal" className="mt-2 md:pr-4 ">
          <Web3Button />
        </div>
        <br />

        <Navbar.Toggle />
      </div>
      <Navbar.Collapse style={{padding:"20px"}}>
        <Navbar.Link style={{ color: "red", fontSize:"20px", borderColor:"blue" ,borderStyle:"solid"}} href="/history">
          <p style={{ textDecoration: "none" ,color: "black", fontSize:"20px",background:"gray", borderColor:"blue" ,borderStyle:"solid",width:"120px"}} className="hover:text-red ">
            {" "}
            History
          </p>
        </Navbar.Link>
        <br />
        <div className="!text-[13px] pt-3 text-center align-middle md:pr-4">
          <div>
          <p className="font-semibold">
            Owner: {localStorage.getItem("owner")}
          </p>
          </div>
          <div>
            <p>Registered Voters Count: <span  className="font-semibold">{localStorage.getItem("registeredVotersCount")}</span></p>
            </div>
        </div>
        <p>Current Stage: <strong>{localStorage.getItem("currStage")}</strong></p>
      </Navbar.Collapse>
    </Navbar>
  );
}
