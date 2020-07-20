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