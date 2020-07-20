class EndPoint {

    constructor() {

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