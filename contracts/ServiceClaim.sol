pragma solidity ^0.5.0;

import "./SafeMath.sol";

contract ServiceClaim {

    bytes32 insurerID;
    bytes32 providerID;
    bytes32 patientID;

    //uint256 claimId;

    //mapping (uint256=>Service) serviceMap;
    //mapping (uint256=>Claim) claimMap;

    struct Service {
        uint256 id;
        string name;
        //bytes32 providerID;
    }

    struct Claim {
        uint256 id;
        uint256 amount;
        //Service service;
        bool verified;
        bool paid;
    }

    Service service;
    Claim claim;

    constructor(bytes32 _proID, bytes32 _patID, uint256 _id, string memory _name, bytes32 _providerID) public {
        //insurerID = _insID;
        providerID = _proID;
        patientID = _patID;
        service = Service(_id, _name);
        //claim = Claim(_id, 0, newService, false, false);
        //return claim;
    }

    // ------------------------------ Functionality of the Network --------------------------- //

    function addClaim(uint256 _claimId, uint256 _amount) public returns(uint256 ClaimID) {
        claim = Claim(_claimId, _amount, false, false);
        return claim.id;
    }

    function verifyClaim() public returns(bytes32 proID, bytes32 patID) {
        //Check if claim was provided to the Patient
        claim.verified = true;
        return (providerID,patientID);
    }
}