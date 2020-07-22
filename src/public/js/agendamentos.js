class Agendamentos extends EndPoint {

    constructor(params) {

        super();
        this.params = params;
        this.listar = '/condominio/gymlist?';
        this.AbrirRecurso('html/listaagenda.html').then(value => {
            params.page.innerHTML = value.toString();

            console.debug(params.data === window.hoje());

            let btndata = document.getElementById('btndata');

            btndata.innerHTML = '<i class="fas fa-angle-left fa-lg"> </i> Hoje';
            btndata.dataset.target = window.hoje();
            btndata.className = 'btn btn-sm border-btn-hoje';

            if (params.data === window.hoje()) {
                btndata.innerHTML = '<i class="fas fa-angle-right fa-lg"> </i> Manhã';
                btndata.dataset.target = window.amanha();
                btndata.className = 'btn btn-sm border-btn-amanha';
            }

            btndata.addEventListener('click', function () {
                window.dispatchEvent(new CustomEvent('AoSelecionarData', {
                    detail: this.dataset.target
                }));
            });

            this.ListaAgendamentos(params.data).then(agendamentos => {
                this.Listar('select=id,horario&autenticacao=eq.' + params.morador.autenticacao + '&data=eq.' + params.data).then(reservado => {
                    this.MontaAgendamentos(agendamentos, reservado);
                });
            })
        });
    }

    ListaAgendamentos(data) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: '/condominio/rpc/gymlist',
                dataType: 'json',
                headers: {
                    Prefer: 'params=single-object',
                },
                success: function (response) {
                    resolve(response);
                }.bind(this),
                data: {data: data}
            }).fail(function (jqXHR) {
                reject(jqXHR);
            });
        })
    }

    MontaAgendamentos(agendamentos, reservado) {

        let modelo = document.getElementById('tplagendamentos');
        let gridagendamentos = document.getElementById('gridagendamentos');

        agendamentos.filter(function (item) {

            if (item.hora <= new Date().getHours())
                return;

            let linha = modelo.content.cloneNode(true);

            linha.getElementById('check').className = 'fas fa-angle-double-right light-grey';
            linha.getElementById('horario').innerText = item.hora + ':00 as '+ item.hora +':59 horas';

            let hora = linha.getElementById('hora');
            hora.id = item.hora;


            let reserva = reservado.find(x => x.horario === item.hora);
            if (reserva === undefined) {

                linha.getElementById('situacao').innerText = item.situacao;
                hora.addEventListener('click', function () {

                    this.Listar('select=horario&autenticacao=eq.' + this.params.morador.autenticacao +
                        '&data=eq.' + this.params.data + '&horario=gt.'+ new Date().getHours()).then(reservado => {
                        window.dispatchEvent(new CustomEvent('AoSelecionarHorario', {
                            detail: {
                                info: {data: this.params.data, horario: item.hora, reservas: reservado}
                            }
                        }));
                    });

                }.bind(this));

            } else {
                let cancelar = linha.getElementById('cancelar-reserva');
                    cancelar.style.display = 'block';
                    cancelar.addEventListener('click', function () {
                        window.dispatchEvent(new CustomEvent('AoSolicitarCancelamento', {
                            detail: {
                                id: reserva.id
                            }
                        }));
                    });
                linha.getElementById('hora-reservado').className = 'col-md-12 agendamentos border-bottom-reservado';
                linha.getElementById('check').className = 'fas fa-check-double blue-text';
                linha.getElementById('badge-reservado').className = 'badge badge-primary float-right';
            }
            gridagendamentos.appendChild(linha);
        }.bind(this));

        window.dispatchEvent(new CustomEvent('AoCaregarAgendamentos', {}));
    }

    Reservar(dados) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: '/condominio/rpc/gymadd',
                dataType: 'json',
                headers: {
                    Prefer: 'params=single-object',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    resolve(response.gymadd);
                }.bind(this),
                data: dados
            }).fail(function (jqXHR) {
                reject(jqXHR.responseJSON.message);
            });
        });
    }

    CancelaReserva(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: '/condominio/rpc/gymdel',
                dataType: 'json',
                headers: {
                    Prefer: 'params=single-object',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    resolve(response);
                }.bind(this),
                data: {id: id}
            }).fail(function (jqXHR) {
                reject(jqXHR.responseJSON.message);
            });
        });
    }


}