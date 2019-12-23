import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';
import $ from 'jquery';
import mermaid from "mermaid";
import EventController from './controllers/EventController.js'; 

//import RdfController from './controllers/RdfController.js';
//import { thisTypeAnnotation } from "@babel/types";

//přiřadit key k talčítkům -> zamyslet se nad využitím 
class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      svg: ""  
    };


    this.eventController = new EventController();
    mermaid.initialize({
      startOnLoad: false,
      //themeCSS: 'g.classGroup text { font-size: 40px; }',
        });
  }

  createGraph = (svg) =>
  {
    this.setState({svg: svg});
  }

  render() {
    return (
      <div className="container">
        <div className="row">
        <div className="form-group col-md-6" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Puro model</label>
            <div className="form-control  transformWindow embed-responsive" id="exampleFormControlTextarea1">
                <img src={require('./model.PNG')} className = "img-fluid"  alt="puro-model"/>
            </div>
          </div>
          <div className="form-group col-md-6" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Onto model</label>
            <div className="form-control transformWindow" id="exampleFormControlTextarea1">
                <Mermaid chart = {this.state.svg}/>
            </div>
          </div>
         
            <QuestionPart graphCreation = {this.createGraph} />
           
        </div>
       
      </div>



    );
  }

}

class PuroModel extends React.Component {

  // $("#iFrameId").contents().find("#yourDiv").empty();
  loaded = () =>
  {
    
    $("#iframePuro").empty();
  }
  render() {
    return  <iframe onLoad = {this.loaded}  id = "iframePuro" className="embed-responsive-item" src = "http://protegeserver.cz/purom4/?model=ca151b74998bee07d442652cc100f821"></iframe>;
  }


}

class Mermaid extends React.Component {
 
  render() {
    return <div dangerouslySetInnerHTML={{__html: this.props.chart}}></div>;
  }
}


class QuestionPart extends React.Component {

  constructor(props)
  {
    super(props);
    this.state = {
    startTransform: true, originalName: "", nameWasChange: false,  
    buttons: [], changeName: false, elName: "", type: ""};
    
    this.eventController = new EventController();
  }

  handleChange = (event) => {
    this.setState({ elName: event.target.value });
  }

  handleSubmit = (event) => {
    event.preventDefault(); 
    
    /*
    window.addEventListener('unhandledrejection', function(event) {
      alert("Rule is not defined!\nOnly the first answer is correct! \nRules are not complete yet!\nPage will be reloaded!");
      window.location.reload(); 
     });
    */
      this.eventController.getDefault().then(results => {
      this.setState({buttons: results.buttons, title: results.title, originalName: results.originalName, type: results.type, startTransform: false});
    });
    
  }

  handleClick = (selectedType, selectedUri, type) => {
     let elName = this.state.elName;
     if (elName === "" && this.state.changeName === true)
     {
       alert("Plese write name of the element!");
     }
     else
     {

        elName = elName.replace(/\s/g, '_');
        
        if (elName !== "" && this.state.changeName === true && !this.eventController.checkDuplicity(elName))
        {
          alert("Element already exists! Please choose different name.")
        }
        else
        {
          this.eventController.nextElement(selectedType,selectedUri,type, elName, this.state.nameWasChange).then(results => {
            let svg = this.eventController.getGraphSvg(); 
            this.setState({buttons: results.buttons,type: results.type, title: results.title, elName: "", changeName: results.elName, originalName: results.originalName});      
            
            if (svg !== false)
            {
              this.createGraph(svg);
            }
            
          });
        }
    }
  }




  createGraph = (chart) => {

      const cb = svg => {  
        this.props.graphCreation(svg);
      
      };
      mermaid.render('id1',chart,cb);
      
    
  }

  handleChangeName = () => {
    this.setState({changeName: !this.state.changeName});
    if (this.state.changeName === true)
    {
      this.setState({elName: this.state.originalName, nameWasChange: false});
    }
    else
    {
      this.setState({elName: "", nameWasChange : true});
    }
  }

  render() {
    return(
      <div className = "container-fluid text-center questionPart">
         <button type="Submint" className= {this.state.startTransform ? "btn btn-primary" : "d-none"} data-toggle="modal" data-target="#exampleModal"  onClick = {this.handleSubmit}>
              Start transformation
          </button>
        <div className = {this.state.startTransform ? "d-none" : ""}>
        <h3>{this.state.title}</h3>
        <div className =  {this.state.changeName === true ? 'col-md-6 mx-auto' : 'd-none'}>
                <div className = "input-group inputName">
                      <div className="input-group-prepend">
                        <span className="input-group-text" id="">Name of the element:</span>
                      </div>
                      <input placeholder = {this.state.originalName === "" ? "Write name of the element!" : this.state.orginalName}    type="text" className="form-control" onChange = {this.handleChange}  value = {this.state.elName}></input>
                  </div> 
              <h5 className = {this.state.buttons.lenght > 1 ? "text-center inputName" : "d-none"}>Select element's class:</h5>  
              </div>
          <div className = "divButtons text-center">
            <ModalButtons  buttons={this.state.buttons} onClick = {this.handleClick} type = {this.state.type} elNames = {this.state.changeName} />
          </div>
         <div className = "text-right col-md-6 mx-auto divLowBtn"> 
          <button type = "button" className= {this.state.originalName === "" || this.state.type.includes("ontoRelation") ? "d-none" : "btn btn-primary btnModal" } onClick = {this.handleChangeName} >{this.state.changeName === true ? "Set original name" : "Change name"}</button>
          <button type = "button" className="btn btn-primary btnModal" onClick = {(() => alert("Will be implemented!"))}>Undo</button>
          <button type="button" className="btn btn-secondary btnModal" data-dismiss="modal">Cancel</button>
         </div>
         </div>
      </div>
    );
  }

}



class ModalButtons extends React.Component {
  constructor(props) {
    super(props);
    this.refs = React.createRef();
  }

  render() {
    if (this.props.type.includes("ontoRelation-save"))
    {
      return (
        <div className="row col-md-5 mx-auto">
          <label className="label label-default col-md-6 mx-auto form-control">{this.props.elNames[0]}</label>
          <label className="label label-default col-md-6 mx-auto form-control">{this.props.elNames[1]}</label>  
          <select ref = "relFrom" className = "col-md-6 mx-auto form-control cardinalitySelect">
              {this.props.buttons.filter((val) => {
                  return val.direction === "from";
              }).map((rel) => { 
               return <option value = {rel.name}>{rel.name}</option>
              })}
          </select>
            
          <select ref = "relTo" className = "col-md-6 mx-auto form-control cardinalitySelect"> 
              {this.props.buttons.filter((val) => {
                  return val.direction === "to";
              }).map((rel) => { 
               return <option value = {rel.name}>{rel.name}</option>
              })}
          </select> 
        
          <button className = "btn btn-success mx-auto questionPart" onClick = {() => this.props.onClick([this.refs.relFrom.value, this.refs.relTo.value], null, this.props.type)}>Next</button> 
        </div> 
      )
    }
    else if (this.props.type.includes("end"))
    {
      return (
        <div className = "col-md-5 mx-auto">
         <button className = "btn btn-success" >Download Onto-UML graph</button>
        </div>
      ); 
    }
    else
    {
      return (
      <div className="row col-md-5 mx-auto">
      {this.props.buttons.map((value) => {
        return  <div className = "col-md-4 mx-auto">
                      <button key = {this.props.uri} type="button"  className="btn btn-success btnModal" onClick = {() => this.props.onClick(value.name, value.uri, this.props.type, value.origin)} >{(this.props.type.includes("dataType") ) ? "Next" : value.name}</button>
                </div>
      })}
     </div>
    )
    }

  }
}

class Page extends React.Component {

  render() {
    return [
      <Layout />
    ]

  }
}

ReactDOM.render(
  <Page />,
  document.getElementById('root')
);

