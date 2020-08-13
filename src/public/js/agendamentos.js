class Agendamentos extends EndPoint {


    constructor(params) {

        super();
        this.params = params;

        if (this.params.local === undefined)
            this.params.local = 'ac';

        this.listar = '/condominio/gymlist?';
        this.datacorrente = params.data;

        this.AbrirRecurso('html/listaagenda.html').then(value => {
            params.page.innerHTML = value.toString();

            let localagenda;
            let seletorlocal = document.getElementById('localagenda');

            if (this.params.local !== undefined)
                seletorlocal.value = this.params.local;

            seletorlocal.addEventListener('change', function () {
                this.params.local = seletorlocal.value;
                localagenda = seletorlocal.value;
            }.bind(this));

            let $input = $('.datepicker').pickadate({
                formatSubmit: 'yyyy-mm-dd',
                min: new Date(2020,7,13),
            });

            let picker = $input.pickadate('picker');
            picker.on({
                close: function () {

                    if (picker.get('select', 'yyyy-mm-dd').length === 0)
                        return;

                    window.dispatchEvent(new CustomEvent('AoSelecionarData', {
                        detail: {data: picker.get('select', 'yyyy-mm-dd'), local: localagenda}
                    }));
                },

            });

            this.ListaAgendamentos(params.data, params.local).then(agendamentos => {
                this.Listar('select=id,horario&autenticacao=eq.' + params.morador.autenticacao + '&data=eq.' + params.data + '&local=eq.' + params.local).then(reservado => {
                    this.MontaAgendamentos(agendamentos, reservado);
                });
            })
        });
    }

    ListaAgendamentos(data, local) {
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
                data: {data: data, local: local}
            }).fail(function (jqXHR) {
                reject(jqXHR);
            });
        })
    }

    MontaAgendamentos(agendamentos, reservado) {

        let modelo = document.getElementById('tplagendamentos');
        let gridagendamentos = document.getElementById('gridagendamentos');

        let ano, mes, dia, datacorrente;

        datacorrente = this.datacorrente.split('-');
        ano = datacorrente[0];
        mes = datacorrente[1];
        dia = datacorrente[2];


        /**
         * Lista os agendamentos recebidos do endpoint
         */
        agendamentos.filter(function (item) {

            /**
             * Se a data selecionada for igua a data corrente e
             * Se o horário obtido do registro for menor em relação ao horário corrente
             * o laço pula para o próximo registro
             */
            if (new Date(ano, mes, dia).getDate() === new Date().getDate() && item.hora <= new Date().getHours())
                return;


            let linha = modelo.content.cloneNode(true);
            linha.getElementById('check').className = 'fas fa-angle-double-right light-grey';
            linha.getElementById('horario').innerText = item.hora + ':00 as ' + item.hora + ':59 horas';
            let hora = linha.getElementById('hora');
            hora.id = item.hora;


            let reserva = reservado.find(x => x.horario === item.hora);
            if (reserva === undefined) {

                linha.getElementById('situacao').innerText = item.situacao;
                hora.addEventListener('click', function () {

                    this.Listar('select=horario&autenticacao=eq.' + this.params.morador.autenticacao +
                        '&data=eq.' + this.params.data + '&horario=gt.' + new Date().getHours()).then(reservado => {
                        window.dispatchEvent(new CustomEvent('AoSelecionarHorario', {
                            detail: {
                                info: {data: this.params.data, horario: item.hora, local: this.params.local, reservas: reservado}
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


    /**
     * Envia o sinal de cancelamento do agendamento para o banco de dados
     * @param id
     * @returns {Promise<unknown>}
     * @constructor
     */
    CancelaReserva(info) {
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
                data: info
            }).fail(function (jqXHR) {
                reject(jqXHR.responseJSON.message);
            });
        });
    }


}