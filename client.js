$(function () {
  getEvents(1)

  function getEvents(page) {
    $.getJSON({
      url: "https://localhost:5001/api/event/pagesize/10/page/" + page,
      success: function (response, textStatus, jqXhr) {
        console.log(response);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // log the error to the console
        console.log("The following error occured: " + textStatus, errorThrown);
      }
    });
  }
});
