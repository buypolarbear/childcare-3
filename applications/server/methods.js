Meteor.methods({
  /**
   * This function will create an application using the given information
   * 1. Create the parent document
   * 2. Create the student document (with status = Application, paid applicationFee = false)
   * 3. Create the studentParents document
   * NOTE: if any of these three went wrong, all others must be reverted
   * 
   * @param  {Object} application All the information submitted from the client
   * @return {}             Result of the operations
   */
  'createApplication': function(application){
    // check to see if they have selected at least one day
    if(application.days.length === 0){
      throw new Meteor.error("No day select",
        "You must select at least one day of the week.");
    }

    // TODO: Blocks the Thread
    // insert the parent
    var parentId = Parents.insert({
      firstName: application.parent.firstName,
      lastName: application.parent.lastName,
      address: application.parent.address.street + " " + application.parent.address.city + " " + application.parent.address.state,
      phoneNumber: application.parent.phone,
      email: application.parent.email,
      createdAt: new Date()
    });

    // constructing the days for the student document
    var days = [];
    var week = {M: "monday", T: "tuesday", W: "wednesday", TH: "thursday", F: "friday"};
    application.days.forEach(function (day) {
      days.push({
        day: week[day].toUpperCase(),
        flexible: false
      });
    });

    // inser the student
    var studentId = Students.insert({
      firstName: application.student.firstName,
      lastName: application.student.lastName,
      dateOfBirth: new Date(application.student.dob),
      group: application.group.toUpperCase(),
      status: "application".toUpperCase(),
      type: application.type.toUpperCase(),
      paidApplicationFee: false,
      daysRequested: days,
      createdAt: new Date()
    });

    // inserting the studentParent document
    var studentParentId = StudentParents.insert({
      studentId: studentId,
      parentId: parentId,
      isPrimary: true,
      createdAt: new Date()
    });

    return {
      status: "201",
      studentId: studentId,
      parentId: parentId,
      studentParentId: studentParentId
    };
  },

  /**
   * This function will more an application from the APPLICATION status to a WAITLIST status
   * 1a. change the status
   * 1b. set the daysWaitlisted = daysRequested
   * 1c. set the paidApplicationFee = true
   * 2. set the order according the current list
   * 3. update the orders of the applications affected
   *  
   * @param  {String} studentId Id of the student that is about to be moved from the application to waitlist
   * @return {[type]}         [description]
   */
  'applicationAccepted': function(studentId){
    var student = Students.findOne({_id: studentId});
    
    // find out what the order for this student should be
    var order = 1;
    var lastInGroup = Students.findOne({status: "WAITLIST", group: student.group, type: student.type}, {sort: {order:-1}});
    if(lastInGroup){
      console.log("1. First Last in group IF");
      order = lastInGroup.order + 1;
    }
    else{
      var where = {status: "WAITLIST", group: student.group};
      if(student.type === "EXISTING"){
        console.log("2. Else and if Existing");
        where['type'] = "MEMBER";
      }

      var lastOtherGroup = Students.findOne(where, {sort: {order:-1}});
      if(lastOtherGroup){
        console.log(lastOtherGroup);
        order = lastOtherGroup.order + 1;
      }
    }

    // TODO: Change this to a better efficient way
    var toBeIncremented = Students.find({status:"WAITLIST", group: student.group, order: {$gte: order}});
    toBeIncremented.forEach(function (student) {
      Students.update({_id: student._id}, {$inc: {order: 1}});
    });

    // THIS WAS NOT WORKING : IT WAS ONLY UPDATING THE LAST ELEMENT
    // Students.update({status:"WAITLIST", group: student.group, order: {$gte: order}}, {$inc: {order:1}});

    // update the student it self 
    Students.update({_id: studentId}, {$set: {status: "WAITLIST", order: order, daysWaitlisted: student.daysRequested, paidApplicationFee: true, }});
  },

  /**
   * [Insert into parent collection]
   * @param  {{parent object}} parent [object containting all required information of a parent containing variables below]
   * @var  {[string]} lname   [Last name of parent]
   * @var  {[string]} fname   [First name of parent]
   * @var  {[string]} email   [email address]
   * @var  {[string]} phone   [phone number]
   * @var  {[string]} address [home address]
   * @return {[SimpleSchema.RegEx.Id]} id  [id of parent inserted]
   */
  'insertParent': function (parent) {

    var id=Parents.insert({
      lastName: parent.plname,
      firstName: parent.pfname,
      email: parent.email,
      phoneNumber: parent.phone,
      address: parent.address,
      createdAt: new Date() // current time
    });
    return id;
  },

  /**
   * [removes parent with id passed]
   * @param  {[SimpleSchema.RegEx.Id]} id [parent id]
   * @return {[type]}    [description]
   */
  'removeParent': function (id) {
    Parents.remove(id);
  },

  /**
   * [insert given data into student collection]
   * @param {{student object}} student [student object containing data for the following object variables]
   * @var  {[string]} lname   [last name of student]
   * @var  {[string]} fname   [first name of student]
   * @var  {[date]} DOB     [student date of birth]
   * @var  {[string]} group   [group the student is in, will be TODDLER or INFANT]
   * @param {{details object}} details [details object containing data for the following object variables]
   * @var  {[string]} status  [status of student, will be APPLICATION, WAITLIST or ENROLLED]
   * @var  {[array of type day (defined in student collection)]} days    [days of the week requested]
   * @var  {[string]} details [any added student details]
   * @param  {[type]} type    [type of student, will be REGULAR, MEMBER or EXISTING]
   *
   * @return {[SimpleSchema.RegEx.Id]} id    [id of student inserted]
   */
  'insertStudent': function (student,details) {

    var id =  Students.insert({
      lastName: student.lname,
      firstName: student.fname,
      dateOfBirth: student.DOB,
      DOW_WAITING: details.days,
      details: details.details,
      status: student.status,
      type: details.type,
      group: student.group,
      paidApplicationFee:details.paid,
      createdAt: new Date() // current time
    });

    return id;
  },
  
  /**
   * [removes student with passed id]
   * @param  {[SimpleSchema.RegEx.Id]} id [id of student to be removed]
   * @return {[type]}    [description]
   */
  'removeStudent': function (id) {
    Students.remove(id);
  },

  /**
   *Increments all student order greater than or equal to order passed
   * @param {{SimpleSchema.RegEx.Id}} id [id of student to increment
   */
  'incrementOrder': function (id) {
    Students.update({_id:id},{$inc:{order:1}});
  },

  /**
   * [description]
   * @param  {[SimpleSchema.RegEx.Id]} id [id of student to be added to waitlist]
   * @return {[type]}    [description]
   */
  'addToWaitlist': function(id, order){
    Students.update({_id: id},{$set:{status:"WAITLIST", order:order}});
  },

  /**
   *[Adds student id and parent id to the studentParent collection]
   * @param  {{SimpleSchema.RegEx.Id}} studentId [id of student associated with parent]
   * @param {{SimpleSchema.RegEx.Id}} parentId  [id of parent associated with student]
   * @returns {{SimpleSchema.RegEx.Id}} id [id of value insterted]
    */
  'insertStudentParent': function(studentId, parentId){
    StudentParents.insert({studentId:studentId, parentId:parentId});
  }
});