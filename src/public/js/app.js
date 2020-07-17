/*
class EndPoint {

    constructor() {
        this.listar = null;
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


*/

