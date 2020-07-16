class EndPoint {
    listar;
    combo;
    pesquisar;
    adicionar;
    editar;
    remover;

    constructor(props) {

    }

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

    // Obtem a lista de registros entre id e valor e devolve num array para ser utiizado num combo
    Combo() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: window.location.origin + this.combo,
                dataType: 'json',
                success: function (response) {
                    let options = [];
                    response.filter(function (item) {
                        options.push({value: item.id, text: item.descricao})
                    });
                    resolve(options);
                }
            }).fail(function (jqXHR) {
                this.ObtemErro(jqXHR);
                reject();
            }.bind(this));
        });
    };

    // Pesquisa um registro utilizando o id da tabela
    Pesquisar(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: window.location.origin + this.pesquisar + id,
                dataType: 'json',
                headers: {
                    Prefer: 'return=representation',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    resolve(response);
                }
            }).fail(function (jqXHR) {
                this.ObtemErro(jqXHR);
                reject();
            }.bind(this));
        });
    };

    // Envia o registro para a tabela
    Adicionar() {

        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: window.location.origin + this.adicionar,
                dataType: 'json',
                headers: {
                    Prefer: 'return=representation',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    resolve(response);
                },
                data: this.novodados
            }).fail(function (jqXHR) {
                this.ObtemErro(jqXHR);
                reject();
            }.bind(this));
        });
    };

    // Altera o registro de uma tabela
    Editar(id) {

        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'PATCH',
                url: window.location.origin + this.editar + id,
                dataType: 'json',
                headers: {
                    Prefer: 'return=representation',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    this.novodados = undefined;
                    resolve(response);
                }.bind(this),
                data: this.novodados
            }).fail(function (jqXHR) {
                this.ObtemErro(jqXHR);
                reject();
            }.bind(this));
        });
    };

    // Remove o registro da tabela
    Remover(id) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'DELETE',
                url: window.location.origin + this.remover + id,
                dataType: 'json',
                headers: {
                    Prefer: 'return=representation',
                    Accept: 'application/vnd.pgrst.object+json'
                },
                success: function (response) {
                    resolve(response);
                },
                data: this.data
            }).fail(function (jqXHR) {
                this.ObtemErro(jqXHR);
                reject();
            }.bind(this));
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

class App extends EndPoint {

    acesso;

    constructor() {
        super();
        
        
        this.acesso = document.getElementById('acesso');
        if (sessionStorage.usuario === undefined) {
            this.AbrirRecurso('html/acesso.html').then(value => {
                this.acesso.innerHTML = value.toString();
                document.getElementById('btnacesso').addEventListener('click', function () {
                    let usuario = document.getElementById('usuario').value;
                    let senha = document.getElementById('senha').value;
                });
                this.acesso.style.display = 'block';
            });
            return;
        }
        this.acesso.style.display = 'none';

    }



}

new App();