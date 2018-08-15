var Catalog = (function ($) {

    var instance;
    var db, currentChatID, currentPersonaID; 
    var lstChatPersona;
    var config;
    var lstChats;
    var lstMessages;
    var lstPersonas;
    var listenPersonas;
    var promises = [];
    var promisePersonasChat = [];
    var nombre;
    var arrayPersons = [];

    function Constructor() {

        function Init(PersonaId) {
            config = GetConfig();
            firebase.initializeApp(config);
            db = firebase.database(); 
            //InicializarBBDD();
            lstChatPersona = new Array();
            currentPersonaID = PersonaId;   
            GetChats();
            GenericFunctions();
            ListenerNotification();

            $('.live-search-box').bind('keyup', function() {
   
                var searchString = $(this).val();

                $("ul#listChats li").each(function(index, value) {
                    
                    currentName = $(value).text()
                    if( currentName.toUpperCase().indexOf(searchString.toUpperCase()) > -1) {
                       $(value).show();
                    } else {
                        $(value).hide();
                    }
                    
                });
                
            })
        }

        function rellenarLstPersonas(a) {
            lstPersonas = a;
        }

        function InitializeList() {
            
        }

        
        function GetConfig() {
            return {
            apiKey: "AIzaSyD5SPC85fg_ydI1ehWi8KxeP9uFZm0b6Tk",
            authDomain: "lebaodatabase-bf8e7.firebaseapp.com",
            databaseURL: "https://lebaodatabase-bf8e7.firebaseio.com",
            projectId: "lebaodatabase-bf8e7",
            storageBucket: "lebaodatabase-bf8e7.appspot.com",
            messagingSenderId: "208369869055"
            };

            
        }
        function deleteChatLi(_chatId) {
            $("#" + _chatId).remove();
        }
        function GetChats() {
            lstChats = db.ref('/PersonasChat/'+currentPersonaID);
            
            //OBTIENE CHATS

          
            lstChats.on('value', function(snapshot) { 
                
                if(snapshot.val() != null)
                {
                    Object.keys(snapshot.val()).forEach(function(_chatID) {
                        var _chat = snapshot.val()[_chatID];
                        
                        var classNewMessages = '';

                        if(_chat.Estatus != -1){
                            if($("#listChats").find('#' + _chatID).length){
                                //Si es el primer chat de la lista entonces se updatea
                                /*if($("#listChats").find('li').first().attr("id") == $("#listChats").find('#' + _chatID).attr("id"))
                                {
                                    UpdateLiChat(_chatID,_chat.Titulo,_chat.LastMessage);
                                }
                                else {//si no, se limpia y se vuelve añadir para que aparezca arriba
                                    deleteChatLi(_chatID);
                                    AddLiChat(_chatID,_chat.Titulo,_chat.LastMessage, classNewMessages, _chat.NewMessages);
                                }
*/
                                UpdateLiChat(_chatID,_chat.Titulo,_chat.LastMessage);
                                
                            }
                            else{
                                if(_chat.NewMessages == 0) 
                                        classNewMessages = 'oculto';

                                var liNotification = GetLiNotification("CHAT", 0, _chatID);
                                if(liNotification.length > 0)
                                    $(liNotification).remove();

                                AddLiChat(_chatID,_chat.Titulo,_chat.LastMessage, classNewMessages, _chat.NewMessages);
                            }

                            if(_chat.NewMessages != 0) {

                                //Si el chat esta activo en ese momento
                                //Updateamos el numero de mensajes de leer en el chat
                                if ($("#" + _chatID).hasClass('active')){
                                    $("#listChats").find('#' + _chatID).find(".bagdeNewMessages").html(_chat.NewMessages).addClass( "oculto");
                                    updateNewMessages(_chatID, currentPersonaID, 0);
                                }
                                else {
                                    $("#listChats").find('#' + _chatID).find(".bagdeNewMessages").html(_chat.NewMessages).removeClass( "oculto");
                                }   
                            }
                            else {
                                $("#listChats").find('#' + _chatID).find(".bagdeNewMessages").html(_chat.NewMessages).addClass( "oculto");    
                            }
                        }
                        else{
                            debugger;
                            if(GetLiNotification("CHAT", 0,_chatID).length > 0)
                                UpdateLiNotification(0, _chatID, "CHAT", _chat.Titulo, _chat.LastMessage, _chat.NewMessages, ""); //stChatPersona[_chatID].join()
                            else
                                AddLiNotification(0, _chatID, "CHAT", _chat.Titulo, _chat.LastMessage, _chat.NewMessages,  "", _chat.CreateDate); //lstChatPersona[_chatID].join()
                        }
                    });
                }
            });

            //SI UN CHAT ES ELIMINADO
            db.ref('/PersonasChat/'+currentPersonaID).on('child_removed', function(snapshot) { 
                if(snapshot.val().Estatus != -1)
                    $("#listChats").find('#' + snapshot.key).remove();
                else
                    GetLiNotification("CHAT",0,snapshot.key).remove();
            });

            $(document).on('click', '.contact', function(){

                
                if($(this).attr("id") == currentChatID)
                    return false;    

                currentChatID = $(this).attr("id");    
                $('#contentChatIntro').hide();
                
                arrayPersons = [];

                if(lstMessages != undefined)
                    lstMessages.off();
                if(listenPersonas != undefined)
                    listenPersonas.off();

                

                var messagesNewsNow = $(this).find('.bagdeNewMessages').html();
                
                if(messagesNewsNow != "0")
                {
                    //Actualizamos los mensajes a cero
                    updateNewMessages(currentChatID, currentPersonaID, 0);
                    $(this).find('.bagdeNewMessages').addClass('oculto');
                }    
                var ref = db.ref().child('/Personas/' + currentChatID).orderByChild('Image');

                promisePersonasChat.push(ref.once('value', snapshot => {
                    if(snapshot.numChildren() == 2)
                        {
                            snapshot.forEach(function(item) {
                            /*var itemVal = item.val();
                            keys.push(itemVal);
                            arrayPersons.push = itemVal;*/
                                if(item.key != currentPersonaID) {
                                    $('.contact-profile').find('img').attr('src','images/' + item.val().Image);
                                }
                            });  
                        }
                    arrayPersons = [];
                    arrayPersons = snapshot.val();
                }));

                Promise.all(promisePersonasChat).then(values => {
                    
                    lstMessages = ListenMessages(currentChatID);
                });

               
                

                $('#listChats').find('li').removeClass("active");
                $(this).addClass("active");
                $(".messages").find("ul").find("li").remove();
                $('#contentChat').show();
                $( ".message-input input").focus();

                GetMessages();
            });


        }
        //Esta funcion sirve para actualizar el numero de mensajes nuevos de una persona en un chat
        function updateNewMessages(_chatId, _personaID, _newMessages) {
            db.ref("PersonasChat/" + _personaID + "/"  + _chatId + "/NewMessages").set(parseInt(_newMessages));
        }

        function snapshotToArray(snapshot) {
            var returnArr = [];

            snapshot.forEach(function(childSnapshot) {
                var item = childSnapshot.val();
                item.key = childSnapshot.key;

                returnArr.push(item);
            });

            return returnArr;
        };

         function GetMessages() {
            //Funcion ajax
            lstChatPersona[currentChatID]= new Array ( 1, 2 );
        }

        function NewMessage() {
    
            var mensaje = $.trim($(".message-input input").val());
            
            if(mensaje == '') 
                return false;

            CrearMensajes(currentChatID, { "Texto": mensaje, "Nombre":  $('#nombre').val(), "PersonaID": currentPersonaID, "CreateDate": Date.now()});


            lstChatPersona[currentChatID].forEach(function(_personaID) { 
                UpdatePersonasInChat(currentChatID,_personaID,mensaje);
            });

            Promise.all(promises).then(values => {
                        
                values.forEach( function(valor, indice, array) {
                
                var titulo = "Undefined";
                var lastMessage = valor.val()[currentChatID].LastMessage;
                var newMessages = 0;
                titulo = valor.val()[currentChatID].Titulo;
                    if(titulo != "Undefined"){
                        if(lstChatPersona[currentChatID][indice] == currentPersonaID) {
                        newMessages = 0;
                         $('#mychats').html("");
                        }
                        else {
                            newMessages = valor.val()[currentChatID].NewMessages + 1
                        }

                        db.ref("PersonasChat/" + lstChatPersona[currentChatID][indice] + "/"  + currentChatID + "/Titulo").set(String(titulo));
                        db.ref("PersonasChat/" + lstChatPersona[currentChatID][indice] + "/"  + currentChatID + "/NewMessages").set(parseInt(newMessages));
                        db.ref("PersonasChat/" + lstChatPersona[currentChatID][indice] + "/"  + currentChatID + "/LastMessage").set(String(mensaje));


                       /* db.ref('PersonasChat/'+lstChatPersona[currentChatID][indice]+"/"+currentChatID).set({
                        "Titulo": titulo, 
                        "NewMessages": newMessages,
                        "LastMessage": mensaje
                        });*/



                    //console.log("Actualicé chat " + currentChatID + " de la persona " + personaID);
                    } 
                });
            });
            promises = [];


            $('.message-input input').val(null);
            var messages = $('.messages');
            var height = messages[0].scrollHeight;
            messages.scrollTop(height);
        };




        function CrearMensajes(chatID,mensaje){ 
            db.ref('Mensajes/'+chatID).push(mensaje);
        }

        /*Escucha mensajes de un determinado chat*/
        function ListenMessages(_chatID) {
            var ref = db.ref('Mensajes/'+_chatID).orderByChild("CreateDate").limitToLast(30);

            ref.on('child_added', function(data){ //Cambio en los mensajes de un chats
                AddLiMessage(data.val().Nombre == $('#nombre').val(), arrayPersons[data.val().PersonaID].Image, data.val().Nombre, data.val().Texto);
                var messages = $('.messages');
                var height = messages[0].scrollHeight;
                messages.scrollTop(height);
                updateNewMessages(currentChatID, currentPersonaID, "0");
                
            });


            return ref;
        }

        function a () {
            alert('1');
        }

        function ListenerNotification(){
            //Notificaciones
            db.ref('/PersonasNotifications/'+currentPersonaID).on('child_added', function(snapshot){ //Cambio en los mensajes de un chats
                if(snapshot.val().Estatus == -1)
                    AddLiNotification(snapshot.key, 0, snapshot.val().NotificationType, snapshot.val().Titulo, "", 0, snapshot.val().PersonaID, snapshot.val().CreateDate);
            });

            db.ref('/PersonasNotifications/'+currentPersonaID).on('child_changed', function(snapshot) { 
                if(snapshot.val().Estatus != -1)
                    GetLiNotification("CALL",snapshot.key,0).remove();
                else
                    ActualizarNotifications(currentPersonaID,snapshot.key,{     
                        Titulo: snapshot.val().Titulo, 
                        PersonaID: snapshot.val().PersonaID, 
                        NotificationType: snapshot.val().NotificationType, 
                        Estatus: snapshot.val().Estatus, 
                        LastUpdate: snapshot.val().LastUpdate,
                        CreateDate: snapshot.val().CreateDate
                    });
            });

            //Eliminación de una notificaciones del tipo call 
            db.ref('/PersonasNotifications/'+currentPersonaID).on('child_removed', function(snapshot) { 
                GetLiNotification("CALL", snapshot.key,0).remove();
            });
        }

        function ListenPersonas(_chatID){
            var ref = db.ref('Personas/' + _chatID);

            ref.on('value', function(data){ //Cambio en los mensajes de un chats
                debugger;
                rellenarLstPersonas(data);
            });
            return ref;
        }

        function GenericFunctions() {
            
            $('.submit').click(function() {
                NewMessage();
            });

            $(document).on('click', '#notificationPanel > li > button', function(){
        
                //Acepta la llamada o el chat
                if($(this).val()=="1"){
                    
                    if($(this).parent().attr("notificationtype") == "CALL"){ //Es una llamada
                        
                        ActualizarNotifications(currentPersonaID,$(this).parent().attr("notificationid"),{  
                            Titulo: $(this).parent().attr("description"), 
                            PersonaID: $(this).parent().attr("personaID"), 
                            NotificationType: $(this).parent().attr("notificationtype"), 
                            Estatus: 1, 
                            LastUpdate: Date.now(),
                            CreateDate: $(this).parent().attr("CreateDate") 
                        });
                        console.log("Backend: Resgistrar llamada a personaID " + $(this).parent().attr("personaID") + " por el gestor " + currentPersonaID);
                    }
                    else{ //Es un chat

                        AsignarChats(currentPersonaID,$(this).parent().attr("chatid"),{     
                            Titulo: $(this).parent().attr("description"), 
                            LastMessage: $(this).parent().attr("chatLastMessage"),
                            NewMessages: $(this).parent().attr("chatNewMessages"),
                            Estatus: 1, 
                            LastUpdate: Date.now(),
                            CreateDate: $(this).parent().attr("CreateDate") 
                        });

                        console.log("Backend: Resgistrar captura de chat " + $(this).parent().attr("chatid") + " por el gestor " + currentPersonaID);
                    }
                }
                else{

                    if($(this).parent().attr("notificationtype") == "CALL"){ //Es una llamada
                        
                        var newPersonaID = 1; //Obtener de backend
                        ReasignarCall(currentPersonaID,1, $(this).parent().attr("notificationid"),{     
                            Titulo: $(this).parent().attr("description"), 
                            PersonaID: $(this).parent().attr("personaID"), 
                            NotificationType: $(this).parent().attr("notificationtype"), 
                            Estatus: -1, 
                            LastUpdate: Date.now(),
                            CreateDate: $(this).parent().attr("CreateDate") 
                        });

                        console.log("Backend: Resgistrar desvio de llamada de personaID " + $(this).parent().attr("personaID") + " por el gestor " + currentPersonaID);
                    }
                    else{ //Es un chat
                        var newPersonaID = 1; //Obtener de backend
                        ReasignarChat(currentPersonaID,newPersonaID,$(this).parent().attr("chatid"), {  
                            Titulo: $(this).parent().attr("description"), 
                            LastMessage: $(this).parent().attr("chatLastMessage"),
                            NewMessages: $(this).parent().attr("chatNewMessages"),
                            Estatus: -1, 
                            LastUpdate: Date.now(),
                            CreateDate: $(this).parent().attr("CreateDate") 
                        });
                        console.log("Backend: Resgistrar devio de chat " + $(this).parent().attr("chatid") + " por el gestor " + currentPersonaID);
                    }
                }
            });
            $(window).on('keydown', function(e) {
                if (e.which == 13) {
                    NewMessage();
                    return false;
                }
            });


            $(".messages").animate({ scrollTop: $(document).height() }, "fast");

            $("#profile-img").click(function() {
                $("#status-options").toggleClass("active");
            });



            $(".expand-button").click(function() {
              $("#profile").toggleClass("expanded");
                $("#contacts").toggleClass("expanded");
            });

            $("#status-options ul li").click(function() {
                $("#profile-img").removeClass();
                $("#status-online").removeClass("active");
                $("#status-away").removeClass("active");
                $("#status-busy").removeClass("active");
                $("#status-offline").removeClass("active");
                $(this).addClass("active");
                
                if($("#status-online").hasClass("active")) {
                    $("#profile-img").addClass("online");
                } else if ($("#status-away").hasClass("active")) {
                    $("#profile-img").addClass("away");
                } else if ($("#status-busy").hasClass("active")) {
                    $("#profile-img").addClass("busy");
                } else if ($("#status-offline").hasClass("active")) {
                    $("#profile-img").addClass("offline");
                } else {
                    $("#profile-img").removeClass();
                };
                
                $("#status-options").removeClass("active");
            });
        }

        /*Updatea en personasChat para todas las personas que estan en un determinado chat*/
        function UpdatePersonasInChat(currentChatID,personaID,lastMessage)
        {
            var newMessages = 0, titulo = "Undefined";

            
            promises.push(firebase.database().ref('PersonasChat/'+personaID).orderByKey().equalTo(String(currentChatID)).once('value', snapshot => {
               newMessages = parseInt(snapshot.val()[String(currentChatID)].NewMessages);
               titulo = snapshot.val()[String(currentChatID)].Titulo;
               newMessages+=1;
              }));
        }


        function InicializarBBDD(){
            
            CrearPersonas(10, 1, {Image: "image1.jpg"});
            CrearPersonas(10, 2, {Image: "image2.jpg"});

            CrearPersonas(11, 1, {Image: "image1.jpg"});
            CrearPersonas(11, 2, {Image: "image2.jpg"});

            //Chats

            AsignarChats(1,10, { Titulo: "Tienda Madrid", LastMessage: "",  NewMessages: 0, Estatus: 1, LastUpdate: Date.now(), CreateDate: Date.now() });
            AsignarChats(2,10, { Titulo: "Tienda Madrid", LastMessage: "",  NewMessages: 0, Estatus: 1, LastUpdate: Date.now(), CreateDate: Date.now() });
            
            AsignarChats(1,11, { Titulo: "Tienda Cartagena", LastMessage: "",  NewMessages: 0, Estatus: 1, LastUpdate: Date.now(), CreateDate: Date.now() });
            AsignarChats(2,11, { Titulo: "Tienda Cartagena", LastMessage: "",  NewMessages: 0, Estatus: 1, LastUpdate: Date.now(), CreateDate: Date.now() });
            AsignarChats(2,13, { Titulo: "Tienda Barcelona", LastMessage: "",  NewMessages: 0, Estatus: -1, LastUpdate: Date.now(), CreateDate: Date.now() });
            
            //Notificaciones
            //estatus: 1=>Activo, 0=>Cerrado, -1=>Sin aceptar
            //NotificationType 1=>Call, 2 => Chat 
            
            AsignarNotifications(2,95, { Titulo: "Call Me", PersonaID: "3", NotificationType: "CALL", Estatus: -1, LastUpdate: Date.now(), CreateDate: Date.now() });
        }

        function AsignarChats(personaID,chatID,chatProperties){
            db.ref('PersonasChat/'+personaID+"/"+chatID).set(chatProperties);
        }
        function CrearMensajes(chatID,mensaje){ 
            db.ref('Mensajes/'+chatID).push(mensaje);
        }
        function CrearPersonas(chatID,personaID,personaProperties) {
            db.ref('Personas/' + chatID + "/" + personaID).set(personaProperties);
        }



        function AddLiNotification(notificationID, chatID, notificationType, description, chatLastMessage, chatNewMessages, personaID, CreateDate){
                    
                    var liElement = "<li style='padding: 5px;' notificationtype='"+notificationType+"' chatid='"+chatID+"' notificationid='"+notificationID+"' chatLastMessage='"+chatLastMessage+"' chatNewMessages='"+chatNewMessages+"' description='"+description+"' personaID = '"+personaID+"' CreateDate = '"+CreateDate+"'>";
                    liElement += "<div id='imagenNotificacion''><img style='width: 50px;' src='http://emilcarlsson.se/assets/mikeross.png'></div>";
                    liElement += "<div class='card card-telefonica '> <div class='card-body card-notification' style='padding-top: 20px;'><h5 class='card-title center'>Carla Gomez</h5><h6 class='card-subtitle mb-2 text-muted center'>Cliente (empleado)</h6>";
                    liElement += "<p class='card-text'><div class='col-lg-12 center pbottom-x' ><div class='btn-group' role='group' aria-label='Basic example'><button type='button' class='btn btn-secondary btn-sm btn-accept-notification btn-accept'>Aceptar</button><button type='button' class='btn btn-sm btn-secondary btn-accept-notification btn-desviar' style=''>Desviar</button></div></div></p>";            
                    liElement += "</p><h6 class='card-subtitle mb-2 text-muted center .ptop-x'>Tiempo de espera</h6><h5 class='card-title center'>0d 2h 34m 34s</h5></div></div></li>";             

                                    
            $("#notificationPanel").append(liElement);
        }

        function UpdateLiNotification(notificationID, chatID, notificationType, description, chatLastMessage, chatNewMessages, personaID){
            var notification = GetLiNotification(notificationType, notificationID, chatID);
            notification.attr("description",description);
            notification.attr("chatLastMessage",chatLastMessage);
            notification.attr("chatNewMessages",chatNewMessages);
            notification.attr("personaID",personaID);
            $(notification.find('span[description]')).html(description);
        }

        function GetLiNotification(notificationType, notificationID, chatID){
            if(notificationType == "CALL")
                return $($("li[notificationid='"+notificationID+"']","#notificationPanel")[0]); 
            else
                return $($("li[chatid='"+chatID+"']","#notificationPanel")[0]); 
        }

        function AddLiChat(chatID,titulo,lastMessage,classNewMessages,newMessages){
            $('#listChats').append('<li class="contact" data-search-term="' + titulo + '" chatid="'+chatID+'" id="' + chatID + '"><div class="row"><div class="col col-lg-8"><div class="wrap"><span class="contact-status busy"></span><img src="blank.gif" alt="" /><div class="meta"><p class="titleChat">' + titulo + '</p><p class="lastMessage">' + lastMessage + '</p></div></div></div><div class="col col-lg-4"><span class="badge badge-pill badge-danger ' + classNewMessages + ' bagdeNewMessages">'+ newMessages+'</span></div></div></li>');
        }

        function UpdateLiChat(chatID,titulo,lastMessage){
            var chat = $("#listChats").find('#' + chatID);
            chat.find('.titleChat').html(titulo);
            chat.find('.lastMessage').html(lastMessage);
            if(chatID != currentChatID)
            {
                if(chat.NewMessages != 0) {
                    chat.find('.bagdeNewMessages').html(chat.NewMessages).removeClass( "oculto");        
                }
            }
        }

        function AddLiMessage(byMe, image, name, text){
            var classMessage = byMe ? "sent" : "replies";
            var liElement = '<li class="'+classMessage+'"><img src="images/' + image + '" alt="" /><p><span style="font-weight:bold;">' + name + ':</span> ' + text + '</p></li>';
            $(".messages ul").append(liElement);
        }


        function ReasignarCall(personaID,newPersonaID,notificationID, notificationProperties){
            var refNot = db.ref('PersonasNotifications/'+personaID+"/"+notificationID);
            refNot.remove();
            notificationProperties.LastUpdate = Date.now();
            db.ref('PersonasNotifications/'+newPersonaID).push(notificationProperties);
        }

        function ReasignarChat(personaID,newPersonaID,chatID, chatProperties){
            var refChat = db.ref('PersonasChat/'+personaID+"/"+chatID);
            refChat.remove();
            //chatProperties.LastUpdate = Date.now();
            db.ref('PersonasChat/'+newPersonaID+"/"+chatID).set(chatProperties);
        }

        function AsignarNotifications(personaID,notificationID,notificationProperties){
            //db.ref('PersonasNotifications/'+personaID+"/"+notificationID).set(notificationProperties);
            db.ref('PersonasNotifications/'+personaID).push(notificationProperties);
        }

        function ActualizarNotifications(personaID,notificationID,notificationProperties){
            //db.ref('PersonasNotifications/'+personaID+"/"+notificationID).set(notificationProperties);
            db.ref('PersonasNotifications/'+personaID+"/"+notificationID).set(notificationProperties);
        }

        return {
            Init: function (PersonaId) {
                Init(PersonaId);
            },

            GetMessages: function () {
                GetMessages();
            }
        }
    }

      
    return {
       getInstance: function () {
           if (!instance) {
               instance = Constructor();
           }
           return instance;
       }
    }
        
    })(jQuery)
