Meteor.methods({
  registerUser: function (firstName,lastName,email, password) {
    return Accounts.createUser({
      profile: {
        firstName: firstName,
        lastName: lastName
      },
      email: email,
      password: password
    });
  },

  // function to change the password
  newPassword: function (currentPassword, newPassword) {
    //return Meteor.users[0].changePassword(currentPassword, newPassword);
    return Meteor.users.changePassword(currentPassword, newPassword);
    //return Accounts.changePassword(currentPassword, newPassword);
  },

  // function to delete a user
  deleteUser: function (user, confirmUser) {
    // TODO: add code to delete user
  }
});