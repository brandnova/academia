.PHONY: help run migrate shell docker-up docker-down docker-logs css dev test superuser clean

help:
	@echo "Available commands:"
	@echo "  make help         - Show this help message"
	@echo "  make run          - Start Django development server"
	@echo "  make migrations   - Create new migrations"
	@echo "  make migrate      - Run database migrations"
	@echo "  make shell        - Open Django shell"
	@echo "  make superuser    - Create Django superuser"
	@echo "  make test         - Run Django tests"

run:
	python manage.py runserver

migrations:
	python manage.py makemigrations

migrate:
	python manage.py migrate

shell:
	python manage.py shell

superuser:
	python manage.py createsuperuser

seed:
	python manage.py seed_demo_data

test:
	python manage.py test
