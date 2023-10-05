import React, { Component } from 'react';
import Web3 from 'web3'
import './App.css';
import Marketplace from '../src/contracts/ItemManager.json'
import Navbar from './Navbar'
import axios from 'axios';
import Main from './Main'

class App extends Component {

  async componentWillMount() {

     axios.get('http://localhost:4000/item')
      .then(response => {
          console.log(response.data );
          this.setState({items: response.data});
      })
      .catch(function (error) {
          console.log(error);
      })

    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    const networkData = Marketplace.networks[networkId]
    if(networkData) {
      const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address)
      this.setState({ marketplace })
      const productCount = await marketplace.methods.itemIndex().call()
      this.setState({ productCount })
      let balance = await web3.eth.getBalance(this.state.account);
      let getETH = await web3.utils.fromWei(balance, 'ether')
      
      
      this.setState({getBalance : getETH})
      console.log(productCount)


      for (var i = 0; i <= this.state.items.data.length - 1; i++) {
        const product = await this.state.items.data[i]
        console.log(product)
        this.setState({
          products: [...this.state.products, product]
        })
        
      }
      console.log(this.state.products)

        // for(var i = 0; i <= productCount - 1; i++){
        //   const item = marketplace.methods.items(i).call();
        //   item.then(value => {
        //     this.setState({
        //       products: [...this.state.products, value]
        //     })
        //   })
        //   console.log(this.state.items)
        //   }
      this.setState({ loading: false})
    } else {
      window.alert('Marketplace contract not deployed to detected network.')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true,
      items:[],
      getBalance: ''
    }

    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
    this.triggerDelivery = this.triggerDelivery.bind(this)
    this.triggerCancel = this.triggerCancel.bind(this)
  }
  createProduct(name, price) {
    this.setState({ loading: true })
    const result = this.state.marketplace.methods.createItem(name, price).send({ from: this.state.account })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })

    result.then( value => {
      let itemAddress = value
      console.log(itemAddress)
      const obj = {
        itemName: name,
        cost: price,
        address: itemAddress.events.SupplyChainStep.returnValues._itemAddress,
        state: itemAddress.events.SupplyChainStep.returnValues._step,
        owner: this.state.account
      };
      axios.post('http://localhost:4000/item/create', obj)
      .then(res => console.log(res.data));
    })
   
  
  }

    purchaseProduct(id, price, idPro) {
      this.setState({ loading: true })
      let result = this.state.marketplace.methods.triggerPayment(id).send({ from: this.state.account, value: price })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
      console.log(idPro)
      result.then( value => {
        let itemAddress = value
        console.log(itemAddress)
        const obj = {
          state: itemAddress.events.SupplyChainStep.returnValues._step,
        };
        axios.put('http://localhost:4000/item//update/'+ idPro, obj)
      .then(res => console.log(res.data));
      })
      
    }
    triggerDelivery(id, idPro) {
      this.setState({ loading: true })
      let result = this.state.marketplace.methods.triggerDelivery(id).send({ from: this.state.account})
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
      console.log(idPro)
      result.then( value => {
        let itemAddress = value
        console.log(itemAddress)
        const obj = {
          state: itemAddress.events.SupplyChainStep.returnValues._step,
        };
        axios.put('http://localhost:4000/item//update/'+ idPro, obj)
      .then(res => console.log(res.data));
      })
      
    }

    triggerReceived(id,ower, idPro) {
      this.setState({ loading: true })
      let result = this.state.marketplace.methods.triggerReceived(id, ower).send({ from: this.state.account})
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
      console.log(idPro)
      result.then( value => {
        let itemAddress = value
        console.log(itemAddress)
        const obj = {
          state: itemAddress.events.SupplyChainStep.returnValues._step,
          owner : this.state.account
        };
        axios.put('http://localhost:4000/item//update/'+ idPro, obj)
      .then(res => console.log(res.data));
      })
      
    }

    triggerCancel(id, idPro){
      this.setState({loading:true})
      let result = this.state.marketplace.methods.triggerCancel(id).send({ from: this.state.account})
      .once('receipt', (receipt) => {
        this.setState({loading: false})
      })
      result.then(value =>{
        let itemAddress = value
        const obj = {
          state: itemAddress.events.SupplyChainStep.returnValues._step,
          owner : this.state.account
        };
        axios.put('http://localhost:4000/item//update/'+ idPro, obj)
      .then(res => console.log(res.data));
      })

    }
    
  


    render() {
      return (
        <div>
          <h3>Hello: {this.state.account}</h3>
          <span>Balance: {this.state.getBalance} ETH</span>
          <h1 className="textH1">SUPPLY CHAIN</h1>
            <h2 className="textH2">ADD ITEM</h2>
            <form onSubmit={(event) => {
            event.preventDefault()
            const name = this.productName.value
            const price = window.web3.utils.toWei(this.productPrice.value.toString(), 'Ether')
            this.createProduct(name, price)
          }}>
              Cost in Wei :{" "}
              <input
                id="productName"
                type="text"
                ref={(input) => { this.productName = input }}
                className="form-control"
                placeholder="Product Name"
                required />
  
              Item Identifier :{" "}
              <input
                id="productPrice"
                type="text"
                ref={(input) => { this.productPrice = input }}
                className="form-control"
                placeholder="Product Price"
                required />
              
              <button className="button" type="submit">Create New Item</button>
              </form>
        <center><h2 className="Showitem">SHOW ITEMS</h2></center>
              <table className="table" >
            <thead className='table-col-wrapper'>
              <tr>
                <th scope="col" className='table-col-heading'>S.No</th>
                <th scope="col" className='table-col-heading'>Name of Item</th>
                <th scope="col" className='table-col-heading'>Price of Item</th>
                <th scope="col" className='table-col-heading'>Address of Item</th>
                <th scope="col" className='table-col-heading'>State of Item</th>
                <th scope="col" className='table-col-heading'>Action</th>
              </tr>
            </thead>
            <tbody id="productList" className="items">
            { this.state.products.map((product, key) => {
              let text ="";
              if (product.state == 0){
                text = "Stocking";
              }else if(product.state == 1){
                text = "Waiting for shipping"
              } else if(product.state == 2) {
                text = "Already shipped"
              } else if(product.state == 3){
                text = "Delivery successful"
              }else{
                text = "Cancel"
              }
  return(
    <tr key={key}>
      <th scope="row">{key}</th>
      <td>{product.itemName}</td>
      <td>{window.web3.utils.fromWei(product.cost.toString(), 'Ether')} Eth</td>
      <td>{product.address}</td>
      <td>{text}</td>
      <td>
        { product.state == 0
          ? product.owner === this.state.account ? "You are Ower" : <button
              name={key}
              value={product.cost}
              onClick={(event) => {
                this.purchaseProduct(event.target.name, event.target.value, product._id)
              }}
            >
              Buy
            </button>
          : product.state == 1 ? product.owner === this.state.account ? <button
          name={key}
          value={product._id}
          onClick={(event) => {
            this.triggerDelivery(event.target.name, event.target.value)
          }}
        >
          Delivery
        </button> : null : product.state == 2 ? product.owner === this.state.account ? "You are Owner" : <div>
        <button
          name={key}
          value={product.owner}
          onClick={(event) => {
            this.triggerReceived(event.target.name, event.target.value, product._id)
          }}
        >
          Received
        </button>
        <button
          name={key}
          value={product._id}
          onClick={(event) => {
            this.triggerCancel(event.target.name, event.target.value,)
          }}
        >
          Cancel
        </button>
        </div> : null
        }
        </td>
    </tr>
  )
})}
            </tbody>
          </table>
        </div>
      );
    }
  }

export default App;