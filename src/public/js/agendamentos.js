class Agendamentos extends EndPoint {

    constructor(params) {

        super();
        this.params = params;
        this.listar = '/condominio/gymlist?';
        this.AbrirRecurso('html/listaagenda.html').then(value => {
            params.page.innerHTML = value.toString();

            let today = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0');
            let yyyy = today.getFullYear();
            let data = `${yyyy}-${mm}-${dd}`;
            this.ListaAgendamentos(data).then(agendamentos => {
                this.Listar('select=horario&autenticacao=eq.' + params.morador.autenticacao + '&data=eq.' + data).then(reservado => {
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
            linha.getElementById('horario').innerText = item.hora;
            linha.getElementById('situacao').innerText = item.situacao;

            let hora = linha.getElementById('hora');
            hora.id = item.hora;


            let reserva = reservado.find(x => x.horario === item.hora);
            if (reserva === undefined) {
                hora.addEventListener('click', function () {

                    let today = new Date();
                    let dd = String(today.getDate()).padStart(2, '0');
                    let mm = String(today.getMonth() + 1).padStart(2, '0');
                    let yyyy = today.getFullYear();
                    let data = `${yyyy}-${mm}-${dd}`;

                    this.Listar('select=horario&autenticacao=eq.' + this.params.morador.autenticacao +
                        '&data=eq.' + data + '&horario=gt.'+ today.getHours()).then(reservado => {
                        window.dispatchEvent(new CustomEvent('AoSelecionarHorario', {
                            detail: {
                                horario: {selecionado: item.hora, reservas: reservado}
                            }
                        }));
                    });


                }.bind(this));

            } else {
                let cancelar = linha.getElementById('cancelar-reserva');
                    cancelar.style.display = 'block';
                    cancelar.addEventListener('click', function () {
                        alert('cancelado');
                    });
                linha.getElementById('hora-reservado').className = 'col-md-9 agendamentos border-bottom-reservado';
                linha.getElementById('check').className = 'fas fa-check-double blue-text';
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
        })
    }


}