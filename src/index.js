import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';
import $ from 'jquery';
import mermaid from "mermaid";
import Parser from 'html-react-parser';
import Pars from 'react-html-parser';
import EventController from './controllers/EventController.js'; 

//import RdfController from './controllers/RdfController.js';
//import { thisTypeAnnotation } from "@babel/types";

//přiřadit key k talčítkům -> zamyslet se nad využitím 
class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldValue: '', chart: "", title: "", fatherUrl: "", startTransform: true, 
      buttons: [], order: 0, 
      ontoModel: [], queryRoots: [], roots: [], changeName: false, elName: "", type: ""};


    this.eventController = new EventController();
    //this.RdfController = new RuleController(); 

    mermaid.initialize({
      startOnLoad: false,
      //themeCSS: 'g.classGroup text { font-size: 40px; }',
        });
  }



  handleChange = (event) => {
    this.setState({ elName: event.target.value });
  }

  handleSubmit = (event) => {
    event.preventDefault(); 
    $("#tools").empty();
    var rules = this.eventController.getDefault();
    this.setState({buttons: rules.buttons, title: rules.title, type: rules.type, startTransform: false});
    /*
    var path = this.ruleController.getFullPath();
    console.log(path);
    path.then(function(results) {
        console.log("IN");
        console.log(results);

        this.setState({queryTree: results}); 
        
        var buttons = this.ruleController.getButtons("BType", ""); 
        this.setState({ order: 0, 
        title: results[0].label.value, 
        buttons: buttons,
        });


      }.bind(this));
      */

     /*
    // někde ulož informaci, že se jedná o first call a pak s tim pracuj
    var results = this.ruleController.firstFind(); 
    
    results.then(function(result) {
      console.log(result);
      // vytvoř metodu pro ged všechny tlacitka 
      var buttons = this.ruleController.getButtons("BType", ""); 
      this.setState({ order: 0, 
        title: result[0].label.value, 
        buttons: buttons,
        queryRoots: result});
   }.bind(this));
   */

  }

  handleClick = (selectedType, selectedUri, type, origin) => {
     let elName = this.state.elName;
  
   
     let chart = `classDiagram
     class Shape{
         <<interface>>
         noOfVertices
         draw()
     }
     class Color{
         <<enumeration>>
         RED
         BLUE
         GREEN
         WHITE
         BLACK
     }`;

    
    
     if (elName === "" && this.state.changeName === true)
     {
       alert("Je nutné zadat název elementu!");
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
          this.eventController.nextElement(selectedType,selectedUri,type, origin, elName).then(function(results) {
            console.log("call");
            console.log(results);
            let svg = this.eventController.getGraphSvg(); 
  
            this.setState({buttons: results.buttons,type: results.type, title: results.title, elName: "", changeName: results.elName});
            
            if (svg !== false)
            {
              this.createGraph(svg);
            }
            
          }.bind(this));
        }
    }
  }


  createGraph(chart) {

 
      
  
      const cb = function(chart){  
   
        this.setState({chart: chart});
      }.bind(this);
      
      mermaid.render('id1',chart,cb);
      
    
  }


  handleClickName = (stateName) =>
  {
    this.setState({changeName : !stateName});
  }

  render() {
    return (
      <div className="container">
        <div className="row">
        <div className="form-group col-md-6" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Puro model</label>
            <div className="form-control  transformWindow embed-responsive" id="exampleFormControlTextarea1">
              <PuroModel /> 
            </div>
          </div>
          <div className="form-group col-md-6" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Onto model</label>
            <div className="form-control transformWindow" id="exampleFormControlTextarea1">
                <Mermaid chart = {this.state.chart}/>
            </div>
          </div>
         
            <QuestionPart startTransform = {this.state.startTransform} type = {this.state.type} title={this.state.title} onChange={this.handleChange} elName = {this.state.elName} buttons={this.state.buttons} onClick = {this.handleClick} onClickName = {this.handleClickName} changeName = {this.state.changeName} onSubmit={this.handleSubmit} />
           
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
  render() {
    return(
      <div className = "container-fluid text-center questionPart">
         <button type="Submint" className= {this.props.startTransform ? "btn btn-primary" : "d-none"} data-toggle="modal" data-target="#exampleModal"  onClick = {this.props.onSubmit}>
              Start transformation
          </button>
        <div className = {this.props.startTransform ? "d-none" : ""}>
        <h3>{this.props.title}</h3>
        <div className =  {this.props.changeName === true ? 'col-md-6 mx-auto' : 'd-none'}>
                <div className = "input-group inputName">
                      <div className="input-group-prepend">
                        <span className="input-group-text" id="">Name of the element:</span>
                      </div>
                      <input placeholder = "Write name of the new element!" type="text" className="form-control" onChange = {this.props.onChange}  value = {this.props.elName}></input>
                  
                  </div> 
                <h5 className = "text-center inputName">Select element's class:</h5>
                
              </div>
          <div className = "divButtons text-center">
            <ModalButtons  buttons={this.props.buttons} onClick = {this.props.onClick} type = {this.props.type} elNames = {this.props.changeName} />
          </div>
         <div className = "text-right col-md-6 mx-auto divLowBtn"> 
          <button type = "button" className="btn btn-primary btnModal">Undo</button>
          <button type="button" className="btn btn-secondary btnModal" data-dismiss="modal">Cancel</button>
         </div>
         </div>
      </div>
    );
  }

}


class ModalWindow extends React.Component {
  render() {
    return (
      <div className="modal fade" id="exampleModal" tabIndex="-1" data-backdrop="static" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog " role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">{this.props.title}</h5>
            </div>
            <div className="modal-body">
              <div className =  {this.props.changeName ? '' : 'd-none'}>
                <div className = "input-group inputName">
                      <div className="input-group-prepend">
                        <span className="input-group-text" id="">Name of the element:</span>
                      </div>
                      <input placeholder = "Write name of the new element!" type="text" className="form-control" onChange = {this.props.onChange}  value = {this.props.elName}></input>
                  
                  </div> 
                <h5 className = "text-center inputName">Select element's class:</h5>
                
              </div>
              <div className="container-fluid text-center">  
                        
                    <ModalButtons buttons={this.props.buttons} onClick = {this.props.onClick} type = {this.props.type} />
              </div>
            </div>
            <div className="modal-footer">
              <button  type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
    {/* <button type = "button"  className =  {this.props.elName ? 'btn btn-primary' : 'd-none'} onClick={() => this.props.onClickName(this.props.changeName)}>Change name</button> */}
              <button type = "button" className="btn btn-primary">Undo</button>
            </div>
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
        <div className="row col-md-6 mx-auto">
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
        <div className = "col-md-6 mx-auto">
         <button className = "btn btn-success" >Download Onto-UML graph</button>
         <button className = "btn btn-success" >Convert to OLED format</button>
        </div>
      ); 
    }
    else
    {
      return (
      <div className="row col-md-6 mx-auto">
      {this.props.buttons.map((value) => {
        return  <div className = "col-md-4 mx-auto">
                      <button key = {this.props.uri} type="button"  className="btn btn-success btnModal" onClick = {() => this.props.onClick(value.name, value.uri, this.props.type, value.origin)} >{(this.props.type.includes("dataType")) ? "Next" : value.name}</button>
                </div>
      })}
     </div>
    )
    }

  }
}


class Board extends React.Component {

  render() {
    return [
      <InputField />
    ]

  }
}


ReactDOM.render(
  <Board />,
  document.getElementById('root')
);

