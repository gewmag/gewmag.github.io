// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MyToken.sol";

contract Election {
    //stages 0,1,2,3,4 αντίστοιχα
    enum Stage { Registration, Candidacy, Voting, Completed, Results }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
    }

    struct Candidate {
        bool isCandidate;
    }

    struct ElectionResult {
        uint256 electionId;
        uint256 timestamp;
        uint256 blockNumber;
        address[] candidates;
        address winner;
        uint256 winnerVotes;
    }

    Stage public currentStage;
    address public owner;
    address public currentWinner;
    uint256 public electionId;
    uint256 public totalElections;
    mapping(uint256 => Stage) public stageByElection;
    mapping(Stage => bool) public stageCompleted;
    mapping(address => address) public candidateTokenContracts;
    mapping(uint256 => uint256) public electionCompletionTimestamps;
    mapping(uint256 => uint256) public electionCompletionBlockNumbers;
    mapping(uint256 => ElectionResult) public electionResults;

    mapping(address => Voter) public voters;
    address[] public registeredVoters;
    mapping(address => Candidate) public candidatesMapping;
    address[] public candidates;
    mapping(address => uint256) public candidatesVotes;
    mapping(address => mapping(address => uint256)) public voterTokens;
    address[] public winners;
    event VoterRegistered(address indexed voter);
    event CandidacyDeclared(address indexed candidate);
    event Voted(address indexed voter, address indexed candidate);
    event WinnerAnnounced(address indexed winner);
    event StageTransition(Stage indexed stage);
    event ElectionResultEmitted(uint256 electionId, uint256 timestamp, uint256 blockNumber, address[] candidates, address winner, uint256 winnerVotes);


 constructor(address[] memory initialVoters) {
        owner = msg.sender;
        electionId = 1; // Αρχικοποίηση των 1ων εκλογών
        currentStage = Stage.Registration;
        stageByElection[electionId] = currentStage;
        stageCompleted[currentStage] = false;
        totalElections = 0;

    // Αρχικοποίηση με κάποιους ψηφοφόρους
     for (uint256 i = 0; i < initialVoters.length; i++) {
        registerVoter(initialVoters[i]);
        voters[initialVoters[i]].isRegistered = true; // Update the voters mapping
    }
}
//Διαχείριση με modifiers
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "You are not a registered voter");
        _;
    }

    modifier onlyCandidate() {
        require(candidatesMapping[msg.sender].isCandidate, "You are not a candidate");
        _;
    }

    modifier atStage(Stage _stage) {
        require(currentStage == _stage, "Function cannot be called at this stage");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    //Εγγραφή στους εκλογικούς καταλόγους αν δεν είναι ήδη εγγεγραμμένος
    function registerVoter(address voter) public onlyOwner {
        require(!voters[voter].isRegistered, "Voter is already registered");
        voters[voter].isRegistered = true;
        voters[voter].hasVoted = false;
        registeredVoters.push(voter);
        
        emit VoterRegistered(voter);//ενημέρωση προς το δίκτυο ότι ο voter οτι είναι εγγράφηκε
    }
    //Αλλαγή του stage των εκλογών μόνο απο τον owner ανάλογα με το τρέχον στάδιο
  function nextStage() public onlyOwner {
    require(currentStage != Stage.Results, "Elections are already completed");
    stageCompleted[currentStage] = true;

    if (currentStage == Stage.Registration) {
        currentStage = Stage.Candidacy;
    } else if (currentStage == Stage.Candidacy) {
        currentStage = Stage.Voting;
    } else if (currentStage == Stage.Voting) {
        currentStage = Stage.Completed;
    } else if (currentStage == Stage.Completed) {
        currentStage = Stage.Results;
    }

    stageCompleted[currentStage] = false;
    emit StageTransition(currentStage);
}
//ο υποψήφιος δηλώνει ποιο token θα χρησιμοποιηθεί για την ψηφοφορία του
    function setCandidateTokenContract(address candidateToken) public onlyCandidate {
            candidateTokenContracts[msg.sender] = candidateToken;
        }
    //o εγγεγραμμένος ψηφοφόρος δηλώνει την υποψηφιότητά του 
    //δίνει σαν είσοδο την διεύθυνση του συμβολαίου του token του

    function declareCandidacy(address candidateToken) public onlyRegisteredVoter atStage(Stage.Candidacy) {
        require(!candidatesMapping[msg.sender].isCandidate, "You are already a candidate");

        //υπολογισμός απαραίτητου αριθμού tokens με βάση τον αριθμό των εγγεγραμμένων voters
        uint256 requiredTokens = registeredVoters.length;

        //διαμοιρασμός tokens σε όλους τους voters για τον κάθε υποψήφιο
        distributeTokensToVoters(candidateToken, requiredTokens);

        candidatesMapping[msg.sender].isCandidate = true;
        candidates.push(msg.sender);
        candidatesVotes[msg.sender] = 0;

        //αποθήκευση της διεύθυνσης του συμβολαίου του token του τρέχοντος υποψηφίου
        candidateTokenContracts[msg.sender] = candidateToken;
        //ενημέρωση προς το δίκτυο ότι ο υποψήφιος δήλωσε υποψηφιότητα επιτυχώς
        emit CandidacyDeclared(msg.sender);
    }

    function distributeTokensToVoters(address candidateToken, uint256 tokensPerCandidate) internal {
        require(tokensPerCandidate > 0, "Tokens per candidate must be greater than 0");

        for (uint256 i = 0; i < registeredVoters.length; i++) {
            //κόψιμο και μεταφορά tokens απο το συμβόλαιο του token του υποψηφίου στους ψηφοφόρους
            address[] memory recipients = new address[](1);
            recipients[0] = registeredVoters[i];

            uint8[] memory amounts = new uint8[](1);
            amounts[0] = uint8(1);
            MyToken(candidateToken).mintAndSend(recipients, amounts);

            //χρησιμοποιείται για να καταγράψει πόσα tokens έχει λάβει κάθε ψηφοφόρος από κάθε υποψήφιο
            voterTokens[registeredVoters[i]][msg.sender] = 1;
        }
    }

  function vote(address  candidate) payable public onlyRegisteredVoter atStage(Stage.Voting)  {
         require(candidatesMapping[candidate].isCandidate, "Invalid candidate address");
    require(!voters[msg.sender].hasVoted, "You have already voted");//αποτροπή διπλοψηφίας
    
   //έλεγχος για το αν ο ψηφοφόρος έχει ήδη ψηφίσει τον υποψήφιο
    require(voterTokens[msg.sender][candidate] > 0, "You don't have enough tokens to vote for this candidate");
     address candidateToken = candidateTokenContracts[candidate];
    require(candidateToken != address(0), "Candidate token contract address not set");

 
    uint256 requiredTokens = uint256(1);
   // μεταφορά του απαιτούμενου αριθμού tokens από τον ψηφοφόρο στον "vault"(voterTokens) του υποψηφίου
    MyToken(candidateToken).transferTokens(msg.sender, address(this),requiredTokens);

    candidatesVotes[candidate]++;
    voters[msg.sender].hasVoted = true;
    emit Voted(msg.sender, candidate);
}

    function announceWinner() public onlyOwner atStage(Stage.Completed) {
        currentStage = Stage.Results;
        totalElections++;
        uint256 maxVotes = 0;
        address winner;
        electionCompletionTimestamps[electionId] = block.timestamp; //αποθήκευση του timestamp της ολοκλήρωσης εκλογών
        electionCompletionBlockNumbers[electionId] = block.number; // αποθήκευση του block number

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidatesVotes[candidates[i]] > maxVotes) {
                maxVotes = candidatesVotes[candidates[i]];
                winner = candidates[i];
            }
        }

         //έλεγχος ισοπαλίας
    
    for (uint256 i = 0; i < candidates.length; i++) {
        if (candidatesVotes[candidates[i]] == maxVotes) {
            winners.push(candidates[i]);
        }
    }

    // αν υπάρχει ισοπαλία επέλεξε τυχαία νικητή
    if (winners.length > 1) {
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % winners.length;
        currentWinner = winners[randomIndex];
    } else {
        currentWinner = winner;
    }
        emit WinnerAnnounced(currentWinner);
        //  Ενημέρωση προς το δίκτυο ότι η φηφοφορία ολοκληρώθηκε με την ανακοίνωση νικητή
        emit ElectionResultEmitted(electionId, block.timestamp, block.number, candidates, currentWinner, candidatesVotes[currentWinner]);

       // αποθήκευση αποτελεσμάτων των εκλογών για το ιστορικό
        electionResults[electionId] = ElectionResult(electionId, block.timestamp, block.number, candidates, currentWinner, candidatesVotes[currentWinner]);
    
    }


function restartElections() public onlyOwner {
    electionId++;
    currentStage = Stage.Registration;

    // απαλοιφή της λίστας των υποψηφίων
    for (uint256 i = 0; i < candidates.length; i++) {
        address candidate = candidates[i];
        delete candidatesMapping[candidate];
        delete candidatesVotes[candidate];
        delete candidateTokenContracts[candidate];
    }

    // απαλοιφή του πίνακα διευθύνσεων των υποψηφίων
    candidates = new address[](0);

   // απαλοιφή της λίστας νικητών
    delete winners;

    // Reset του hasVoted flag για όλους τους εγγεγραμμένους ψηφοφόρους
    for (uint256 i = 0; i < registeredVoters.length; i++) {
        voters[registeredVoters[i]].hasVoted = false;
    }

    // Reset των μεταβλητών κατάστασης
    emit StageTransition(currentStage);
    stageByElection[electionId] = currentStage; //θέτουμε το stage για την επόμενη φηφοφορία
}
//views
    function getRegisteredVotersCount() public view returns (uint256) {
        return registeredVoters.length;
    }

   function getAllElectionResults() public view returns (ElectionResult[] memory) {
        ElectionResult[] memory allResults = new ElectionResult[](totalElections);
        for (uint256 i = 1; i <= totalElections; i++) {
            allResults[i - 1] = electionResults[i];
        }
        return allResults;
    }

    function getElectionResult(uint256 electionIdd) public view returns (ElectionResult memory) {
        return electionResults[electionIdd];
    }

// καταστροφή του συμβολαίου καλείται απο τον ιδιοκτήτη
      function destroyContract() public onlyOwner {
        selfdestruct(payable(owner));
    }
// διαβίβαση ιδιοκτησίας συμβολαίου απο τον ιδιοκτήτη στον νέο ιδιοκτήτη
     function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
