let unidade = null, morador = null, usuario = null, agenda;
let containeracesso = document.getElementById('acesso');
let containermoradores = document.getElementById('moradores');
let containeragendamentos = document.getElementById('agendamentos');
let finaliza = document.getElementById('finaliza');
let home = document.getElementById('home');
let historico = document.getElementById('historico');
let aguarde = document.getElementById('aguarde');
let moradores = document.getElementById('moradores');
let navhome = document.getElementById('nav-home');
let navmoradores = document.getElementById('nav-moradores');
let navhistorico = document.getElementById('nav-historico');
let nav = document.getElementById('navegacao');

let itensmenu = [containeracesso, containermoradores, containeragendamentos, finaliza, home, historico, moradores];

AtivarItemMenu = function(ativar) {
    itensmenu.filter(function (item) {
        if (ativar !== item) {
            item.style.display = 'none';
        } else {
            item.style.display = 'block';
        }
    });
    document.getElementById('novidades').style.display = 'none';

    aguarde.style.display = 'block';
};

let gym = function() {

    let messages = new window.messages();

    this.Iniciar = function () {

        unidade = JSON.parse(sessionStorage.unidade);
        aguarde.style.display = 'block';
        nav.style.visibility = 'visible';

        navhome.addEventListener('click', function () {
            AtivarItemMenu(home);
            new Home({page: home, unidade: unidade});
        }.bind(this));

        navmoradores.addEventListener('click', function () {
            AtivarItemMenu(containermoradores);
            new Moradores({page: containermoradores, unidade: unidade});
        }.bind(this));

        navhistorico.addEventListener('click', function () {
            AtivarItemMenu(historico);
            new Historico({page: historico, unidade: unidade})
        }.bind(this));

        new Home({page: home, unidade: unidade});
    };

    this.ConfirmaHorario = function (info) {

        agenda.Reservar({data: info.data, horario: info.horario, morador: morador.autenticacao, local: info.local}).then(() => {
            new EndPoint().AbrirRecurso('html/finaliza.html').then(finalizapage => {
                finaliza.innerHTML = finalizapage.toString();

                let local = 'Aademia';
                if (info.local === 'bk')
                    local = 'Sala de bike';

                document.getElementById('morador').innerText = morador.nome.split(' ')[0].initCap();
                document.getElementById('local').innerText = local;
                document.getElementById('data').innerText = info.data + ' às ' + info.horario + ' horas';
                containeragendamentos.style.display = 'none';
                finaliza.style.display = 'block';
            });
        }).catch(reason => {
            messages.alert('Atenção', reason, function (result) {
                console.error(result);
            });
        });
    };

    window.addEventListener('AntesdeLogar', function (e) {
    }.bind(this));

    window.addEventListener('AoLogar', function (e) {
        unidade = e.detail.unidade;
        usuario = e.detail.usuario;
        sessionStorage.unidade = JSON.stringify(unidade);
        containeracesso.style.display = 'none';
        this.Iniciar();
    }.bind(this));

    window.addEventListener('AoCaregarLoginPage', function () {
        containeracesso.style.display = 'block';
    }.bind(this));

    window.addEventListener('AoCaregarMoradores', function () {
        containermoradores.style.display = 'block';
        aguarde.style.display = 'none';
    });

    window.addEventListener('AoCaregarHome', function () {
        home.style.display = 'block';
        aguarde.style.display = 'none';
        document.getElementById('iniciaragendamentos').addEventListener('click', function () {
            AtivarItemMenu(containermoradores);
            new Moradores({page: containermoradores, unidade: unidade});
        }.bind(this));

        let novidades = document.getElementById('novidades');

        let log = document.getElementById('log');
        itensmenu.push(log);

        log.addEventListener("click", function (){

            AtivarItemMenu(log);
            new Novidades({page: novidades});

        }.bind(this));

    }.bind(this));

    window.addEventListener('AoCaregarNovidades', function () {
        // let novidades = document.getElementById('novidades');
        novidades.style.display = 'block';
        aguarde.style.display = 'none';
    }.bind(this));

    window.addEventListener('AoSelecionarMorador', function (e) {
        morador = e.detail.morador;
        containermoradores.style.display = 'none';
        aguarde.style.display = 'block';
        agenda = new Agendamentos({page: containeragendamentos, unidade: unidade, morador: morador, data: window.hoje()});
    });

    window.addEventListener('AoCaregarAgendamentos', function () {
        containeragendamentos.style.display = 'block';
        aguarde.style.display = 'none';
    });

    window.addEventListener('AoSelecionarHorario', function (e) {
        if (e.detail.info.reservas.length > 0) {
            messages.alert('Atenção', 'Você ainda não concluiu a reserva anterior', function (result) {
                console.info(result);
            });
        } else {
            messages.materialConfirm('Confirmação de Reserva', 'Você confirma a reserva para as ' + e.detail.info.horario + ' horas?', function (result) {
                if (result === true) {
                    this.ConfirmaHorario({data: e.detail.info.data, horario: e.detail.info.horario, local: e.detail.info.local});
                }
            }.bind(this));
            //sss
        }
    }.bind(this));

    window.addEventListener('AoSolicitarCancelamento', function (e) {
        messages.materialConfirm('Atenção', 'Você confirma o cancelamento desta reserva?', function (result) {
            if (result === true) {
                agenda.CancelaReserva({id: e.detail.id, usuario: usuario}).then(value => {
                    aguarde.style.display = 'block';
                    agenda = new Agendamentos({page: containeragendamentos, unidade: unidade, morador: morador, data: window.hoje()});
                }).catch(reason => {
                    console.error(reason);
                });
            }
        }.bind(this));
    });

    window.addEventListener('AoSelecionarData', function (e) {
        agenda = new Agendamentos({page: containeragendamentos, unidade: unidade, morador: morador, data: e.detail.data, local: e.detail.local});
    });

    window.addEventListener('AoCaregarHistorico', function (e) {
        historico.style.display = 'block';
        aguarde.style.display = 'none';
    });


    if (sessionStorage.unidade === undefined) {
        new Acesso({page: containeracesso});
    } else {
        unidade = sessionStorage.unidade;
        this.Iniciar();
    }

};

String.prototype.initCap = function () {
    return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
        return m.toUpperCase();
    });
};

window.hoje = function() {

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;

};

window.amanha = function() {

    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let dd = String(tomorrow.getDate()).padStart(2, '0');
    let mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    let yyyy = tomorrow.getFullYear();
    return `${yyyy}-${mm}-${dd}`;

};

window.messages = function() {

    let materialCallback = null;
    this.alert = function(title, text, callback ){
        document.getElementById('materialModalTitle').innerHTML = title;
        document.getElementById('materialModalText').innerHTML = text;
        document.getElementById('materialModalButtonCANCEL').style.display = 'none';

        let materialModal = document.getElementById('materialModal');
        materialModal.className = 'show';
        materialModal.onclick = function() {
            this.closeMaterialAlert(event, false);
        }.bind(this);

        let materialModalContent = document.getElementById('materialModalContent');
        materialModalContent.onclick = function() {
            event.stopPropagation();
        }.bind(this);

        let materialModalButtonOK = document.getElementById('materialModalButtonOK');
        materialModalButtonOK.onclick = function() {
            this.closeMaterialAlert(event, true);
        }.bind(this);

        let materialModalButtonCANCEL = document.getElementById('materialModalButtonCANCEL');
        materialModalButtonCANCEL.onclick = function() {
            this.closeMaterialAlert(event, false);
        }.bind(this);

        materialCallback = callback;
    }.bind(this);

    this.materialConfirm = function( title, text, callback ){
        this.alert( title, text, callback );
        document.getElementById('materialModalButtonCANCEL').style.display = 'block';
    }.bind(this);

    this.closeMaterialAlert = function(e, result){
        e.stopPropagation();
        document.getElementById('materialModal').className = 'hide';
        if(typeof materialCallback === 'function') materialCallback(result);
    };
};