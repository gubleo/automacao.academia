class EndPoint {
    listar;

    Listar(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: window.location.origin + this.listar + id,
                dataType: 'json',
                success: function (response) {
                    resolve(response);
                }
            }).fail(function (jqXHR) {
                this.ObtemErro(jqXHR);
                reject();
            }.bind(this));
        });
    };

    Adicionar() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: window.endpoint + this.parametros.origem,
                dataType: 'json',
                headers: {
                    Prefer: 'return=representation',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    resolve(response);
                },
                data: this.dados
            }).fail(function (jqXHR) {
                reject(new Error(jqXHR.responseJSON.message));
            });
        });
    };

    AbrirRecurso(alvo) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: alvo,
                success: function (response) {
                    resolve(response);
                }
            }).fail(function (jqXHR) {
                reject(jqXHR);
            });
        });
    }

    ObtemErro(jqXHR) {
        if (jqXHR.responseJSON !== undefined)
            reject(new Error(jqXHR.responseJSON.message));
        console.error(jqXHR);
        return undefined;
    }
}

// Login usuário
class Acesso extends EndPoint {

    constructor(params) {
        super();
        this.AbrirRecurso('html/acesso.html').then(value => {
            params.page.innerHTML = value.toString();
            this.submeter = document.getElementById('btnacesso');
            this.submeter.addEventListener('click', this.SolicitaLogin);
            window.dispatchEvent(new CustomEvent('AoCaregarLoginPage', {}));
        });
    }

    SolicitaLogin() {

        let usuario = document.getElementById('usuario');
        let senha = document.getElementById('senha');

        window.dispatchEvent(new CustomEvent('AntesdeLogar', {}));

        $.ajax({
            type: 'POST',
            url: '/condominio/rpc/gymlogin',
            dataType: 'json',
            headers: {
                Prefer: 'params=single-object',
                Accept: 'application/vnd.pgrst.object+json'
            },
            success: function (response) {
                window.dispatchEvent(new CustomEvent('AoLogar', {
                    detail: {
                        unidade: response.gymlogin
                    }
                }));
            }.bind(this),
            data: {usuario: usuario.value, pass: senha.value}
        }).fail(function (jqXHR) {
            console.error(jqXHR);
        });
    }
}

class Moradores extends EndPoint {

    constructor(params) {
        super();
        this.listar = '/condominio/moradores?select=num,nome,autenticacao,foto1&unidade=eq.';

        this.AbrirRecurso('html/listamoradores.html').then(value => {
            params.page.innerHTML = value.toString();
            this.Listar(params.unidade).then(value => {
                this.MontaListView(value);
            });
        });
    }

    MontaListView(lista) {

        let modelo = document.getElementById('tplmoradores');
        let gridmoradores = document.getElementById('gridmoradores');

        lista.filter(function (item) {

            let linha = modelo.content.cloneNode(true);
            linha.getElementById('nome').innerText = item.nome;
            linha.getElementById('foto').style.backgroundImage = 'url("' + item.foto1 + '")';
            linha.getElementById('num').addEventListener('click', function () {
                window.dispatchEvent(new CustomEvent('AoSelecionarMorador', {
                    detail: {
                        morador: item
                    }
                }));
            });
            gridmoradores.appendChild(linha);

        });

        window.dispatchEvent(new CustomEvent('AoCaregarMoradores', {}));
    }
}

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

                    this.Listar('select=horario&autenticacao=eq.' + this.params.morador.autenticacao + '&data=eq.' + data + '&horario=gt.'+ today.getHours()).then(reservado => {
                        window.dispatchEvent(new CustomEvent('AoSelecionarHorario', {
                            detail: {
                                horario: {selecionado: item.hora, reservas: reservado}
                            }
                        }));
                    });


                }.bind(this));

            } else {
                hora.className = 'reservado';
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

(function () {

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

        agenda.Reservar({data: data, horario: horario, morador: morador.autenticacao}).then(value => {
            new EndPoint().AbrirRecurso('html/finaliza.html').then(finalizapage => {
                finaliza.innerHTML = finalizapage.toString();
                containeragendamentos.style.display = 'none';
                finaliza.style.display = 'block';
                sessionStorage.clear();
            });
        }).catch(reason => {
            alert(reason)
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
        if (e.detail.horario.reservas.length > 0) {
            alert('Você ainda não concluiu a reserva anterior');
        } else {
            if (confirm('Você confirma a reserva para as ' + e.detail.horario.selecionado + 'hs?')) {
                this.ConfirmaHorario(e.detail.horario.selecionado);
            }
        }
    }.bind(this));

    if (sessionStorage.unidade === undefined) {
        new Acesso({page: containeracesso});
    } else {
        unidade = sessionStorage.unidade;
        this.Iniciar();
    }

})();