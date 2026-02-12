export class CheckIn {
    constructor() {
        this.modal = document.getElementById('checkin-modal');
        this.btnOpen = document.getElementById('btn-checkin');
        this.btnClose = document.getElementById('btn-close-modal');
        this.form = document.getElementById('checkin-form');
        this.btnSubmit = document.getElementById('btn-submit-checkin');

        if (!this.modal || !this.btnOpen) {
            console.warn('CheckIn: UI elements not found');
            return;
        }

        this.initEvents();
    }

    initEvents() {
        // Open Modal
        this.btnOpen.addEventListener('click', () => this.open());

        // Close Modal (X button)
        this.btnClose.addEventListener('click', () => this.close());

        // Close Modal (Click outside) - Disabled by user request
        // this.modal.addEventListener('click', (e) => {
        //     if (e.target === this.modal) {
        //         this.close();
        //     }
        // });

        // Form Submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    open() {
        this.modal.classList.add('visible');
    }

    close() {
        this.modal.classList.remove('visible');

        // Fix: Reset Layout Shift & Keyboard on Mobile
        if (document.activeElement) {
            document.activeElement.blur(); // Close Keyboard
        }
        window.scrollTo(0, 0); // Reset Scroll Position
        document.body.scrollTop = 0; // For Safari
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Loading State
        if (document.activeElement) document.activeElement.blur(); // Close Keyboard immediately
        const originalText = this.btnSubmit.textContent;
        this.btnSubmit.textContent = '전송 중...';
        this.btnSubmit.disabled = true;

        const formData = new FormData(this.form);
        const scriptURL = 'https://script.google.com/macros/s/AKfycbzXbPw4qbj-hxJ_jWDqtxHERLYhu0gPaAA4c8H6hbB_CUSmNW_ntERvX1cLUg_gMWbw/exec';

        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("신청이 완료되었습니다!");
                this.form.reset();
                this.close();
            } else {
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            console.error('Error!', error.message);
            alert("전송에 실패했습니다. 다시 시도해주세요.");
        } finally {
            // Restore Button
            this.btnSubmit.textContent = originalText;
            this.btnSubmit.disabled = false;
        }
    }
}
