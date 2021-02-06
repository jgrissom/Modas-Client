$(function () {
  var toasts = [];
  var refreshInterval;
  var snd = new Audio("bell.wav"); // buffers automatically when created

  verifyToken()

  function verifyToken() {
    // check for existing token
    var token = Cookies.get('token');
    alert(token);
  }

  function getEvents(page) {
    $.getJSON({
      url: "https://modasapi.azurewebsites.net/api/event/pagesize/10/page/" + page,
      success: function (response, textStatus, jqXhr) {
        //console.log(response);
        showTableBody(response.events);
        showPagingInfo(response.pagingInfo);
        initButtons();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // log the error to the console
        console.log("The following error occured: " + textStatus, errorThrown);
      }
    });
  }

  function refreshEvents() {
    $.getJSON({
      url: "https://modasapi.azurewebsites.net/api/event/count",
      success: function (response, textStatus, jqXhr) {
        if (response != $('#total').html()) {
          console.log("success");
          // Toast
          toast("Motion Detected", "New motion alert detected!", "fas fa-user-secret");
          // play sound effect
          snd.play();
          getEvents($('#current').data('val'));
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // log the error to the console
        console.log("The following error occured: " + jqXHR.status, errorThrown);
      }
    });
  }

  function showTableBody(e) {
    var html = "";
    for (i = 0; i < e.length; i++) {
      var f = e[i].flag ? "fas" : "far";
      html += "<tr>";
      html += "<td class=\"text-center\">";
      html += "<i data-id=\"" + e[i].id + "\" data-checked=\"" + e[i].flag + "\" class=\"" + f + " fa-flag fa-lg flag\" />";
      html += "</td>";
      html += "<td>";
      html += "<div class=\"d-none d-md-block\">" + get_long_date(e[i].stamp) + "</div >";
      html += "<div class=\"d-md-none\">" + get_short_date(e[i].stamp) + "</div >";
      html += "</td>";
      html += "<td>" + get_time(e[i].stamp) + "</td>";
      html += "<td>" + e[i].loc + "</td>";
      html += "</tr> ";
    }
    $('tbody').html(html);
  }

  function showPagingInfo(p) {
    $('#start').html(p.rangeStart);
    $('#end').html(p.rangeEnd);
    $('#total').html(p.totalItems);
    $('#first').data('page', 1);
    $('#next').data('page', p.nextPage);
    $('#prev').data('page', p.previousPage);
    $('#last').data('page', p.totalPages);
    $('#current').data('val', p.currentPage);
  }

  function initButtons() {
    // disable prev/first buttons when on first page
    $('#first, #prev').prop('disabled', $('#start').html() == "1");
    // disable next/last buttons when on last page
    $('#last, #next').prop('disabled', $('#end').html() == $('#total').html());
  }

  function get_long_date(str){
    var month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var full_date = str.split("T")[0];
    var year = full_date.split("-")[0];
    var month = full_date.split("-")[1];
    var date = full_date.split("-")[2];
    var d = new Date(year + "-" + Number(month) + "-" + Number(date))

    return dow[d.getDay()] + ", " + month_names[d.getMonth()] + " " + date + ", " + year;
  }
  function get_short_date(str){
      return str.split("T")[0];
  }
  function get_time(str){
      var time = str.split("T")[1];
      var hours = Number(time.split(":")[0]);
      var am_pm = hours >= 12 ? " PM" : " AM";
      hours = hours > 12 ? hours - 12 : hours;
      hours == 0 ? hours = "12" : hours;
      hours = hours < 10 ? "0" + hours : hours + "";
      var minutes = time.split(":")[1];
      return hours + ":" + minutes + am_pm;
  } 

  function toast(header, text, icon){
    // create unique id for toast using array length
    var id = toasts.length;
    // generate html for toast
    var toast = "<div id=\"" + id + "\" class=\"toast\" style=\"min-width:300px;\">" +
      "<div class=\"toast-header\">" +
      "<strong class=\"mr-auto\">" + header + "</strong><button type=\"button\" class=\"ml-2 mb-1 close\" data-dismiss=\"toast\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button></div>" +
      "<div class=\"toast-body\"><i class=\"" + icon + "\"></i> " + text + "</div>" +
      "</div>";
    // append the toast html to toast container
    $('#toast_container').append(toast);
    // add toast id to array
    toasts.push(id);
    // show toast
    $('#' + id).toast({ delay: 1500 }).toast('show');
    // after toast has been hidden
    $('#' + id).on('hidden.bs.toast', function () {
      // remove toast from array
      toasts.splice(id);
      // remove toast from DOM
      $('#' + id).remove();
    });
  }

  function initAutoRefresh(){
    // if auto-refresh button is set to true
    if ($('#auto-refresh').data('val')) {
      // display checked icon
      $('#auto-refresh i').removeClass('fa-square').addClass('fa-check-square');
      // start timer
      refreshInterval = setInterval(refreshEvents, 2000);
    } else {
      // display unchecked icon
      $('#auto-refresh i').removeClass('fa-check-square').addClass('fa-square');
      // if the timer is on, clear it
      if (refreshInterval) {
          clearInterval(refreshInterval);
      }
    }
}

  // event listeners for first/next/prev/last buttons
  $('#next, #prev, #first, #last').on('click', function () {
    getEvents($(this).data('page'));
  });

  // delegated event handler needed
  // http://api.jquery.com/on/#direct-and-delegated-events
  $('tbody').on('click', '.flag', function () {
    var checked;
    if ($(this).data('checked')) {
      $(this).data('checked', false);
      $(this).removeClass('fas').addClass('far');
      checked = false;
    } else {
      $(this).data('checked', true);
      $(this).removeClass('far').addClass('fas');
      checked = true;
    }
    // AJAX to update database
    $.ajax({
      headers: { "Content-Type": "application/json" },
      url: "https://modasapi.azurewebsites.net/api/event/" + $(this).data('id'),
      type: 'patch',
      data: JSON.stringify([{ "op": "replace", "path": "Flagged", "value": checked }]),
      success: function () {
        // Toast
        toast("Update Complete", "Event flag " + (checked ? "added." : "removed."), "far fa-edit");
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // log the error to the console
        console.log("The following error occured: " + jqXHR.status, errorThrown);
      }
    });
  });

  // event listener to toggle data auto-refresh
  $('#auto-refresh').on('click', function () {
    $(this).data('val', !($(this).data('val')));
    initAutoRefresh();
  });

  $('#signIn a').on('click', function(e){
    e.preventDefault();
    // display modal
    $('#signInModal').modal();
  });

  $('#submitButton').on('click', function(e){
    e.preventDefault();

    // verify username and password using the token api
    $.ajax({
      headers: { 'Content-Type': 'application/json' },
      url: "https://modasapi.azurewebsites.net/api/token",
      type: 'post',
      data: JSON.stringify({ "username": $('#username').val(), "password": $('#password').val() }),
      success: function (data) {
        // save token in a cookie
        Cookies.set('token', data["token"], { expires: 7 });
        // hide modal
        $('#signInModal').modal('hide');
        verifyToken();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // log the error to the console
        console.log("The following error occured: " + jqXHR.status, errorThrown);
      }
    });
  });
});
