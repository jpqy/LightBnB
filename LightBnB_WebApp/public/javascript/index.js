$(() => {
  getAllListings().then(function( json ) {
    propertyListings.addProperties(json.properties, false, true);
    views_manager.show('listings');

    // Mentor Q: Best way/file/time to create event handler?
    $(".booking-form").on('submit', function(event) {
      event.preventDefault();

      const data = $(this).serialize();
      makeReservation(data)
        .then(json => {          
          $(this).html(`<h2>Booked!</h2>`)
        });
    });
  });
});