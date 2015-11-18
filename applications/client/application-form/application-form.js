//removes errors if returning to application page
Template.applicationForm.rendered = function(){
  Errors.remove({type:'validation'});
  Session.set("secondParent", false);
};


Template.applicationForm.events({
  /**
   * Submits form and inserts student and parent information. Will appear on waitlist.
   * @param  {[eventMap]} event [description]
   * @return {[type]}       [description]
   */
  "submit form": function(event){
    event.preventDefault();
    Errors.remove({type:'validation'});
    //retrieve data from form
    var formValidated=true;
    var notConceived = $(event.target).find('input:checkbox[name=notConceived]:checked').val();
    var days=[];
    $("input:checkbox[name=days]:checked").each(function(){
      days.push($(this).val());
    });
    if(days.length<2){
      Errors.insert({message:'Please check at least two days', seen:false, type:'validation'});
      formValidated=false;
    }
    if($(event.target).find('input:radio[name=type]:checked').val()==null){
      Errors.insert({message:'Please select affiliation', seen:false,type:'validation'});
      formValidated=false;

    }
    if($(event.target).find('input:radio[name=group]:checked').val()==null){
      Errors.insert({message:'Please select group', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.pfname.value==""){
      Errors.insert({message:'Please enter Parent First Name', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.plname.value==""){
      Errors.insert({message:'Please select Parent Last Name', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.fname.value==""){
      Errors.insert({message:'Please enter student first name', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.lname.value==""){
      Errors.insert({message:'Please enter student last name', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.street.value==""){
      Errors.insert({message:'Please enter street', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.city.value==""){
      Errors.insert({message:'Please enter city', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.state.value==""){
      Errors.insert({message:'Please enter state', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.zip.value==""){
      Errors.insert({message:'Please enter ZIP', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target['phone-number'].value==""){
      Errors.insert({message:'Please enter phone number', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.email.value==""){
      Errors.insert({message:'Please enter email', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.dob.value=="" && notConceived!="NC"){
      Errors.insert({message:'Please enter Date Of Birth or select Not Conceived', seen:false,type:'validation'});
      formValidated=false;
    }
    if(event.target.sdate.value==""){
      Errors.insert({message:'Please enter Start Date', seen:false,type:'validation'});
      formValidated=false;
    }
    var secondParentObj = {
      active: false
    };
    if(Session.get("secondParent")){
       secondParentObj = {
        lastName:event.target['second-plname'].value,
        firstName:event.target['second-pfname'].value,
        email:event.target['second-email'].value,
        address: {
          street:event.target['second-street'].value,
          city:event.target['second-city'].value,
          state:event.target['second-state'].value,
          zip:event.target['second-zip'].value,
        },
        phone:event.target['second-phone-number'].value,
        active: true
      };
      if(!secondParentValidate(secondParentObj)){
        formValidated=false;
      }
    }
if(!formValidated){
  scroll(0,0);
  return;
}


    var application = {
      // Parent Information
      parent:{
        firstName: event.target.pfname.value,
        lastName: event.target.plname.value,
        address: {
          street: event.target.street.value,
          city: event.target.city.value,
          state: event.target.state.value,
          zip: event.target.zip.value
        },
        phone: event.target['phone-number'].value,
        email: event.target.email.value
      },
      //second aprent information
      secondParent: secondParentObj,
      // Student information 
      student:{
        firstName: event.target.fname.value,
        lastName: event.target.lname.value,
        dob: event.target.dob.value,
        conceived: notConceived
      },

      // Other details of the application
      startDate: event.target.sdate.value,
      days: days,
      type: $(event.target).find('input:radio[name=type]:checked').val(),
      group: $(event.target).find('input:radio[name=group]:checked').val(),
      flexible: $(event.target).find('input:checkbox[name=flexible]:checked').val(),
      details: event.target.details.value,
    };



    // console.log(application);

    // var studentObj = ({lname:lname,fname:fname,DOB:DOB,group:group, status:"APPLICATION"});
    // var parentObj=({plname:plname,pfname:pfname,address:address,email:email,phone:phone});
    // var detailsObj=({days:days, type:type, details:details,requestedStart:requestedStart,paid:false});
    Errors.remove({});
    Meteor.call("createApplication", application, createApplicationCallback);

    // Clear the form
    scroll(0,0);
    event.target.reset();
	},
  "click #addParent":function(event){
    event.preventDefault();
    $(".hidden").removeClass('hidden');
    $("#addParent").replaceWith("<button type=\"button\" class=\"btn btn-primary\" id=\"collapse\">Collapse</button>");
    Session.set("secondParent", true);
  },
  "click #collapse":function(event){
    event.preventDefault();
    $("#collapse").replaceWith("<button type=\"button\" class=\"btn btn-primary add\" id=\"addParent\">Add another Parent</button>");
    $(".secondParentBackground").addClass('hidden');
    Session.set("secondParent", false);
  }
});

/**
 * This function simply handles the result of the 
 * @param  {[type]} res [description]
 * @param  {[type]} err [description]
 * @return {[type]}     [description]
 */
function createApplicationCallback(err, res){
  if(err){
    Errors.insert({type:'application', message:'Something went wrong', seen:false});
    // Do some real error checking and let the use know what happned
    console.log(err);
   // alert(err);
  }

  if(res.status === 201){

    Router.go("applications");
  }
  return;
}

function secondParentValidate(secondParentObj){
  var valid=true;
  if(secondParentObj.firstName==""){
    Errors.insert({message:'Please enter second parent first name', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.lastName==""){
    Errors.insert({message:'Please enter second parent last name', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.address.street==""){
    Errors.insert({message:'Please enter second parent street', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.address.city==""){
    Errors.insert({message:'Please enter second parent city', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.address.state==""){
    Errors.insert({message:'Please enter second parent state', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.address.zip==""){
    Errors.insert({message:'Please enter second parent ZIP', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.phone==""){
    Errors.insert({message:'Please enter second parent phone number', seen:false,type:'validation'});
    valid=false;
  }
  if(secondParentObj.email==""){
    Errors.insert({message:'Please enter second parent email', seen:false,type:'validation'});
    valid=false;
  }
  return valid;
}