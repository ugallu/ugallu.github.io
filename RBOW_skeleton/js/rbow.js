// set links
$(function(){

  $("#logout_btn").on("click", function(){
    console.log("ee");
    window.location.href = "/index.html";
  });
  // set menu
  $('#tables_btn').on("click",function(){
    $( "#content" ).load( "static/tables.html", onTableLoad);
  });
  $('#functions_btn').on("click",function(){
    $( "#content" ).load( "static/functions.html");
  });
  $('#mystuff_btn').on("click",function(){
    $( "#content" ).load( "static/mystuff.html");
  });
  $('#addtable_btn').on("click",function(){
    $( "#content" ).load( "static/addtable.html");
  });
  $('#addfunction_btn').on("click",function(){
    $( "#content" ).load( "static/addfunction.html");
  });
  $('#profile_btn').on("click",function(){
    $( "#content" ).load( "static/profile.html");
  });

  $(".popup .close").on("click",function(){
    $(".popup").hide();
  });

  // on index load:
  $( "#content" ).load( "static/tables.html", onTableLoad);

  function onTableLoad(){
      // dev purpose
      $('.table_view_btn').on("click",function(){
        $( "#content" ).load( "static/table.html", function(){
            $('.chunk').on("click",function(){
              $( "#content" ).load( "static/chunk.html", function(){

              });
            });
        });

      });
  }
});
