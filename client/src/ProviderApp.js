import React, { Component } from "react";
import ClaimVerification from "./contracts/Organizations.json"
import getWeb3 from "./utils/getWeb3";
import PatientCell from './components/PatientCell'
import Header from './components/Header'
import { Row, Col, Form, Input, Button, FormGroup, InputGroup, InputGroupAddon } from 'reactstrap';
import ReactDOM from "react-dom"
import $ from 'jquery'
import Provider from "./contracts/Provider.json";
import Footer from './components/Footer'
import LineGraph from './views/Line Chart'
import PieChart from './views/Pie Chart'
import { store } from 'react-notifications-component';
import "./App.css";

export class ProviderApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: this.props.web3,
      accounts: this.props.accounts,
      proContractAddress: this.props.proContractAddress, //this stores the address that will be used to create a contract
      proContract: null,
      patients: [],
    };
    this.providerID = null
    this.patientname = null;
    this.serviceClaimID = null;
    this.updatePatientName = this.updatePatientName.bind(this);
    this.provideService = this.provideService.bind(this);
    this.fileClaim = this.fileClaim.bind(this);
  }

  notification_patientCellCreated(patientname) {
    $.ajax({
      url: 'http://localhost:4000/patientCellCreated',
      type: 'POST',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      crossDomain: true,
      dataType: 'json',
      xhrFields: { withCredentials: true },
      data: {
        patientname
      },
      success: (data) => {
        if (data.message === 'OK') {
          console.log('Success sending email')
        }
        else {
          console.log('ERROR sending email');
        }
      }
    });
  }

  notification_claimAdded(patientname, serviceID, service, amount) {
    $.ajax({
      url: 'http://localhost:4000/claimAdded',
      type: 'POST',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      crossDomain: true,
      dataType: 'json',
      xhrFields: { withCredentials: true },
      data: {
        patientname,
        serviceID,
        service,
        amount
      },
      success: (data) => {
        if (data.message === 'OK') {
          console.log('Success sending email')
        }
        else {
          console.log('ERROR sending email');
        }
      }
    });
  }

  notification_serviceClaimCreated(patientname, serviceID, service) {
    $.ajax({
      url: 'http://localhost:4000/serviceClaimCreated',
      type: 'POST',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      crossDomain: true,
      dataType: 'json',
      xhrFields: { withCredentials: true },
      data: {
        patientname,
        serviceID,
        service
      },
      success: (data) => {
        if (data.message === 'OK') {
          console.log('Success sending email')
        }
        else {
          console.log('ERROR sending email');
        }
      }
    });
  }

  updatePatientName({ target }) {
    this.patientname = target.value
  }

  componentDidMount = async () => {
    const { accounts, proContract } = this.state;
    const contract = new this.state.web3.eth.Contract(Provider.abi, this.state.proContractAddress);
    console.log('localProviderContract', contract)
    this.setState({ proContract: contract })
    // console.log('provider contract', this.state.proContract)
    var p = await contract.methods.getInsAddr().call()
    console.log('insAddr', p);
    try {
      var patientAddrs = await contract.methods.getPatients().call();
      if (patientAddrs.length === 0) {
        console.log('adding initial patient');
        const addedPatient = await contract.methods.addPatient('Ken').send({ from: accounts[0] });
        const newPatientAddress = await contract.methods.getNewPatient('Ken').call();
        console.log('New Patient Contract Address added', newPatientAddress)
        // Send "Ken and newAddress back to App.js"
        this.props.addPatContractAddress(newPatientAddress)
      }
      patientAddrs = await contract.methods.getPatients().call();

      console.log("Patients: ", patientAddrs);
      var list = [];
      for (var i = 0; i < patientAddrs.length; i++) {
        var addr = patientAddrs[i];
        var name = await contract.methods.getPatientName(addr).call();
        list.push({ name, addr })
      }
      this.setState({ patients: list })
      console.log(this.state.patients)
    }
    catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  provideService = async (serviceName, patientAddr) => {
    const { accounts, proContract } = this.state;
    const info = await proContract.methods.provideService(serviceName, patientAddr, Date.now()).send({ from: accounts[0] });
    this.serviceClaimAddr = info.events.SCID.returnValues.addr;
    console.log('provided service Addr ', this.serviceClaimAddr)
    // this.notification_serviceClaimCreated(this.patientname, this.serviceClaimID, serviceName);
    store.addNotification({
      title: "Service Provided",
      message: "You may now file a claim for that service to the patient.",
      type: "default",
      insert: "top",
      container: "top-right",
      animationIn: ["animated", "zoomIn"],
      animationOut: ["animated", "zoomOut"],
      dismiss: {
        duration: 5000,
        onScreen: true
      }
    });
    return info;
  }

  fileClaim = async (serviceClaimAddr, amount) => {
    const { accounts, proContract } = this.state;
    const info = await proContract.methods.fileClaim(serviceClaimAddr, amount, Date.now()).send({ from: accounts[0] });
    // this.notification_claimAdded(this.patientname, serviceClaimID, serviceName, amount);
    console.log('Adding Claim', info.events)
    store.addNotification({
      title: "Claim Filed",
      message: "Patient and Insurer are notified about the claim.",
      type: "success",
      insert: "top",
      container: "top-right",
      animationIn: ["animated", "zoomIn"],
      animationOut: ["animated", "zoomOut"],
      dismiss: {
        duration: 5000,
        onScreen: true
      }
    });
    return info;
  }

  onFormSubmit = async (e) => {
    e.preventDefault()
    const { accounts, proContract } = this.state;
    const info = await proContract.methods.addPatient(this.patientname).send({ from: accounts[0] });
    console.log("Added patient", info)
    let name = info.events.PatientCreated.returnValues.name;
    let addr = info.events.PatientCreated.returnValues.addr;
    let patientList = this.state.patients;
    patientList.push({name, addr});
    console.log(patientList)
    this.setState({ patients: patientList })
    store.addNotification({
      title: "Patient Added",
      message: "Check your list to view them now.",
      type: "info",
      insert: "top",
      container: "top-right",
      animationIn: ["animated", "zoomIn"],
      animationOut: ["animated", "zoomOut"],
      dismiss: {
        duration: 5000,
        onScreen: true
      }
    });
    document.getElementById('onboard').value = ''
    // this.notification_patientCellCreated(this.patientname);
  }

  render() {
    console.log('Rendering ProviderApp')
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div>
        <Header />
        <Row style={{ marginTop: '1.2rem', marginLeft: '10%', marginRight: '10%' }}>
          <Col md={6}>
            <h2 id='centerText'>Patient List</h2>
            <ul id='cells'>
              {this.state.patients.map((o, i) => {
                return <PatientCell name={o.name}
                  key={i}
                  patientAddr={o.addr}
                  providerID={this.providerID}
                  provideService={this.provideService}
                  fileClaim={this.fileClaim}
                  web3={this.state.web3}
                  accounts={this.state.accounts}
                  contract={this.state.contract}
                  notification_claimAdded={this.notification_claimAdded}
                />
              })}
            </ul>
          </Col>
          <Col md={6}>
            <div style={{ border: '2px solid #327cc9', padding: '3%', marginBottom: '1rem', backgroundColor: '#fafafa' }}>
              <h5 id='centerText'>Onboard a New Patient</h5>
              <Form id="form" onSubmit={this.onFormSubmit} inline style={{ padding: 0 }}>
                <InputGroup>
                  <Input id='onboard' placeholder="Name" onChange={this.updatePatientName}/>
                  <InputGroupAddon addonType="append"><Button type="submit" color='success'>Add</Button></InputGroupAddon>
                </InputGroup>
              </Form>
            </div>
            <div style={{ border: '2px solid #327cc9', padding: '3%' }}>
              <PieChart />
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ProviderApp;
