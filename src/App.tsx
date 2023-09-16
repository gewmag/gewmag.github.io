import { useState, useEffect } from "react";
import { Tabs } from "flowbite-react";
import { HiUserCircle, HiClipboardList, HiAdjustments } from "react-icons/hi";
import { readContract } from "@wagmi/core";
import ElectionJSON from "./abis/Election.json";
import NavbarWithCTAButton from "./pages/NavbarWithDropdown";
import RegistrationForm from "./pages/Registration";
import AnnouncementCard from "./pages/Announcement";
import CandidacyForm from "./pages/Candinacy";
import VotingForm from "./pages/Voting";
import ClipLoader from "react-spinners/ClipLoader";
// Ορισμός των διάφορων καταστάσεων 
enum ElectionStage {
  Registration,
  Candidacy,
  Voting,
  Completed,
  Results,
}

export default function ElectionTabs() {
   //το useState είναι React Hook  για να δημιουργήσει διάφορες καταστάσεις (states) για το component
  const [currentStage, setCurrentStage] = useState<ElectionStage>(
    ElectionStage.Registration
  );
  const [activeTab1, setActiveTab1] = useState<Boolean>(false);
  const [activeTab2, setActiveTab2] = useState<Boolean>(false);
  const [activeTab3, setActiveTab3] = useState<Boolean>(false);
  const [activeTab4, setActiveTab4] = useState<Boolean>(false);
  const [loading, setLoading] = useState<Boolean>(true);
//fetchCurrentStage():Καλεί το readContract() για να διαβάσει την τρέχουσα κατάσταση (stage)
  //από το συμβόλαιο Elections.sol με βάση τη συγκεκριμένη διεύθυνση και το ABI του συμβολαίου.
  //Βάσει της τιμής που επιστρέφεται, ο κώδικας καθορίζει την τρέχουσα κατάσταση.
  //Ανάλογα με την τρέχουσα κατάσταση, η συνάρτηση ρυθμίζει το activeTab1, activeTab2 κ.λπ., για να ενεργοποιήσει τις αντίστοιχες καρτέλες για τον χρήστη.
  //Αποθηκεύει την τρέχουσα κατάσταση στο localStorage, έτσι ώστε να μπορεί να χρησιμοποιηθεί σε διάφορα μέρη της εφαρμογής.
  async function fetchCurrentStage() {
    try {
      const data: any = await readContract({
        address: `0x${ElectionJSON.address}`, // Replace with the actual address
        abi: ElectionJSON.abi, // Replace with the actual ABI
        functionName: "currentStage",
      });
      const owner: any = await readContract({
        address: `0x${ElectionJSON.address}`, // Replace with the actual address
        abi: ElectionJSON.abi, // Replace with the actual ABI
        functionName: "owner",
      });
      setCurrentStage(data);
      switch (data) {
        case 0:
          setActiveTab1(true);
          localStorage.setItem("currStage", "Registration(1)");
          break;
        case 1:
          setActiveTab2(true);
          localStorage.setItem("currStage", "Candidacy(2)");
          break;
        case 2:
          setActiveTab3(true);
          localStorage.setItem("currStage", "Voting(3)");
          break;
        case 3 || 4:
          setActiveTab4(true);
          localStorage.setItem("currStage", "Results(4)");
          break;
      }
      localStorage.setItem("owner", owner);
    } catch (e) {
      console.log("Error fetching current stage:", e);
    }
  }
//το useEffect() ξεκινά όταν το component τίθεται σε λειτουργία και εκτελείται 1 φορά γιατί οι [] είναι άδειες, αν ήθελα να ελέγχει κάτι θα έβαζα το αντίστοιχο μέσα στις [].
  useEffect(() => {
    fetchCurrentStage();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);

    console.log(activeTab1, activeTab2, activeTab3, activeTab4);
  }, []);

  return (
    <div className="max-h-[90vh] h-screen self-center align-middle text-center items-center">
      {loading ? (
        <ClipLoader
        className="flex items-center justify-center h-screen z-100"
          color="#000000"
          size={250}
        />
      ) : (
        <>
          <NavbarWithCTAButton />
          <Tabs.Group aria-label="Election Stages">
            <Tabs.Item
              active={activeTab1 || currentStage === 0 ? true : false}
              icon={HiUserCircle}
              title="Register"
              disabled={!activeTab1} // Μόνο ο διαχειριστής μπορεί να εγγράψει ψηφοφόρους
            >
              <RegistrationForm />
            </Tabs.Item>
            <Tabs.Item
              active={activeTab2 || currentStage === 1 ? true : false}
              disabled={!activeTab2} // Μόνο εγγεγραμμένοι ψηφοφόροι μπορούν να υποβάλουν υποψηφιότητα
              icon={HiAdjustments}
              title="Candidacy"
            >
              <CandidacyForm />
            </Tabs.Item>
            <Tabs.Item
              active={activeTab3 || currentStage === 2 ? true : false}
              icon={HiClipboardList}
              disabled={!activeTab3}// Μόνο εγγεγραμμένοι ψηφοφόροι μπορούν να ψηφίσουν
              title="Voting"
            >
              <VotingForm />
            </Tabs.Item>
            <Tabs.Item
              active={activeTab4 || currentStage !== 3 ? true : false}
              icon={HiUserCircle}
              disabled={false} // Μόνο εγγεγραμμένοι ψηφοφόροι μπορούν να δουν τα αποτελέσματα
              title="Results"
            >
              <AnnouncementCard />
            </Tabs.Item>
          </Tabs.Group>
        </>
      )}
    </div>
  );
}
