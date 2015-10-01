Meteor.startup(function(){
  // add the classes
  var classroomIds = [];
  var parentCount = 50;

  if(Classrooms.find().count() === 0){
    [
      {
        name: "Infant Classroom",
        type: "INFANT",
        capacity: 20,
        createdAt: new Date()
      },
      {
        name: "Toddler Classroom",
        type: "TODDLER",
        capacity: 15,
        createdAt: new Date()
      }
    ].forEach(function (classroom) {
      classroomIds.push(Classrooms.insert(classroom));
    });
  }

  // add all the parents
  // 
  var studentGroups = ['TODDLER', 'INFANT'];
  var studentStatus = ['WAITLIST', 'APPLICATION', 'ENROLLED'];
  var studentTypes = ['REGULAR', 'MEMBER', 'EXISTING'];
  if(Parents.find().count() === 0){
    for(var i=0;i<parentCount;i++){
      HTTP.get("https://randomuser.me/api/", {headers:{dataType: 'json'}}, function(err, data){
        var person = EJSON.parse(data.content).results[0].user;

        var parent = {
          firstName: person.name.first,
          lastName: person.name.last,
          dateOfBirth: person.dob,
          image: person.picture.medium,
          email: person.email,
          phoneNumber: person.phone,
          isPrimary: true,
          createdAt: new Date()
        };

        var parentId = Parents.insert(parent);

        // create the kids for them
        var studentCount = Math.floor(Math.random()*3)+1;
        for (var j=0;j<studentCount;j++){
          HTTP.get("https://randomuser.me/api/", {headers:{dataType: 'json'}}, function(err, data){
            var newStudent = EJSON.parse(data.content).results[0].user;

            // generating the days the student is about to be waitlisted and then enrolled
            var numberOfDays = Math.floor(Math.random()*5)+1;
            var randomDays = getRandom(daysOfWeek, numberOfDays);
            var days = [];
            for(var k=0,len=randomDays.length;k<len;k++){
              days.push({
                day: randomDays[k],
                flexible: (Math.random() > 0.5)? true:false
              });
            }

            var status = studentStatus[Math.floor(Math.random()*3)];
            var group = studentGroups[Math.floor(Math.random()*2)];
            var student = {
              firstName: newStudent.name.first,
              lastName: newStudent.name.last,
              dateOfBirth: newStudent.dob,
              image: "http://api.adorable.io/avatars/150/" + newStudent.salt,
              group: group,
              status: status,
              type: studentTypes[Math.floor(Math.random()*3)],
              classId: (group == "INFANT")?classroomIds[0]:classroomIds[1],
              paidApplicationFee: (status == "APPLICATION")?false:true,
              daysWaitlisted: days,
              daysEnrolled: (status == "ENROLLED")?days: null,
              createdAt: new Date()
            };

            var studentId = Students.insert(student);

            // connect the student and parent
            StudentParents.insert({
              parentId: parentId,
              studentId: studentId
            });
          })
        }
      });
    }
  }
});


var daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// http://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len;
  }
  return result;
}