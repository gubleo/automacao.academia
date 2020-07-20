let gym = function() {

    let messages = new window.messages();

    let unidade = null, morador = null, agenda;
    let containeracesso = document.getElementById('acesso');
    let containermoradores = document.getElementById('moradores');
    let containeragendamentos = document.getElementById('agendamentos');
    let finaliza = document.getElementById('finaliza');
    let aguarde = document.getElementById('aguarde');

    this.Iniciar = function () {
        aguarde.style.display = 'block';
        new Moradores({page: containermoradores, unidade: unidade});
    };

    this.ConfirmaHorario = function (horario) {
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();
        let data = `${yyyy}-${mm}-${dd}`;

        agenda.Reservar({data: data, horario: horario, morador: morador.autenticacao}).then(() => {
            new EndPoint().AbrirRecurso('html/finaliza.html').then(finalizapage => {
                finaliza.innerHTML = finalizapage.toString();
                document.getElementById('morador').innerText = morador.nome.split(' ')[0].initCap();
                document.getElementById('data').innerText = `${dd}/${mm}/${yyyy}`;
                document.getElementById('horario').innerText = horario;
                containeragendamentos.style.display = 'none';
                finaliza.style.display = 'block';
                sessionStorage.clear();
            });
        }).catch(reason => {
            messages.alert('Atenção', reason, function (result) {
                console.log(result);
            });
        });
    };

    window.addEventListener('AntesdeLogar', function (e) {
    }.bind(this));

    window.addEventListener('AoLogar', function (e) {
        unidade = e.detail.unidade;
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

    window.addEventListener('AoSelecionarMorador', function (e) {
        morador = e.detail.morador;
        containermoradores.style.display = 'none';
        aguarde.style.display = 'block';
        agenda = new Agendamentos({page: containeragendamentos, unidade: unidade, morador: morador});
    });

    window.addEventListener('AoCaregarAgendamentos', function () {
        containeragendamentos.style.display = 'block';
        aguarde.style.display = 'none';
    });

    window.addEventListener('AoSelecionarHorario', function (e) {
        this.horariodefinido = e.detail.horario.selecionado;
        if (e.detail.horario.reservas.length > 0) {
            messages.alert('Atenção', 'Você ainda não concluiu a reserva anterior', function (result) {
                console.log(result);
            });
        } else {
            messages.materialConfirm('Atenção', 'Você confirma a reserva para as ' + e.detail.horario.selecionado + 'hs?', function (result) {
                if (result === true) {
                    this.ConfirmaHorario(e.detail.horario.selecionado);
                }
            }.bind(this));
        }
    }.bind(this));

    window.addEventListener('AoSolicitarCancelamento', function (e) {
        messages.materialConfirm('Atenção', 'Você confirma o cancelamento desta reserva?', function (result) {
            if (result === true) {
                agenda.CancelaReserva(e.detail.id).then(value => {
                    aguarde.style.display = 'block';
                    agenda = new Agendamentos({page: containeragendamentos, unidade: unidade, morador: morador});
                }).catch(reason => {
                    console.error(reason);
                });
            }
        }.bind(this));
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