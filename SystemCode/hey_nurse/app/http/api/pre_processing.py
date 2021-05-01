import numpy as np
import pandas as pd
import nltk
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')
from numpy import random
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.tree import DecisionTreeRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.naive_bayes import BernoulliNB
from sklearn.naive_bayes import MultinomialNB
from sklearn.neighbors import KNeighborsClassifier
from nltk.corpus import stopwords
from nltk.corpus import wordnet
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import SGDClassifier
from sklearn.linear_model import LogisticRegression
from app.http.api.dbquery import doInsertRequest

def pre_processing(inputStr):
    data = pd.read_csv('./Symptom_severity_training_data_updated.csv') 

    STOPWORDS = (stopwords.words('english'))
    STOPWORDS.remove('not')
    STOPWORDS.remove('very')
    STOPWORDS.append('need')
    STOPWORDS.append('want')
    STOPWORDS.append('feel')

    lemmatizer = WordNetLemmatizer()

    def nltk_tag_to_wordnet_tag(nltk_tag):
        if nltk_tag.startswith('J'):
            return wordnet.ADJ
        elif nltk_tag.startswith('V'):
            return wordnet.VERB
        elif nltk_tag.startswith('N'):
            return wordnet.NOUN
        elif nltk_tag.startswith('R'):
            return wordnet.ADV
        else:          
            return None

    def lemmatize_sentence(sentence):
        nltk_tagged = nltk.pos_tag(nltk.word_tokenize(sentence))  
        wordnet_tagged = map(lambda x: (x[0], nltk_tag_to_wordnet_tag(x[1])), nltk_tagged)
        lemmatized_sentence = []
        for word, tag in wordnet_tagged:
            if tag is None:
                lemmatized_sentence.append(word)
            else:        
                lemmatized_sentence.append(lemmatizer.lemmatize(word, tag))
        return " ".join(lemmatized_sentence)

    def clean_text(text):
        """
            text: a string
        
            return: modified initial string
        """
        text = text.lower()
        text = lemmatize_sentence(text)
        text =' '.join(word for word in text.split() if word not in STOPWORDS)
        return text

    data['Symptom']=data['Symptom'].apply(clean_text)

    X = data.Symptom
    Y_classification = data.weight

    X_train, X_test, y_train, y_test = train_test_split(X, Y_classification, test_size=0.2, random_state=2)

    nb=Pipeline([('Vect', CountVectorizer(ngram_range=([1,3]))),
                ('tfidf', TfidfTransformer()),
                ('clf', MultinomialNB()),
                ])
    nb.fit(X_train, y_train)

    sgd =Pipeline([('Vect', CountVectorizer(ngram_range=([1,3]))),
                ('tfidf', TfidfTransformer()),
                ('clf', SGDClassifier(loss='hinge', random_state=2, max_iter=5, tol=None)),
                ])
    sgd.fit(X_train, y_train)


    logreg =Pipeline([('Vect', CountVectorizer(ngram_range=([1,3]))),
                 ('tfidf', TfidfTransformer()),
                ('clf', LogisticRegression(C=1e5)),
                ])
    logreg.fit(X_train, y_train)


    dt =Pipeline([('Vect', CountVectorizer(ngram_range=([1,3]))),
                ('tfidf', TfidfTransformer()),
                ('clf', DecisionTreeClassifier(criterion='gini',random_state=2)),
                ])
    dt.fit(X_train, y_train)

   
    knn =Pipeline([('Vect', CountVectorizer(ngram_range=([1,3]))),
                ('tfidf', TfidfTransformer()),
                ('clf', KNeighborsClassifier(n_neighbors=5)),
                ])
    knn.fit(X_train, y_train)


    input = inputStr 

    result1=nb.predict([input])
    result2=sgd.predict([input])
    result3=logreg.predict([input])
    result4=dt.predict([input])
    result5=knn.predict([input])

    def most_frequent(List):
        counter=0
        num=0
        
        for i in List:
            curr_freq=List.count(i)
            if(curr_freq>counter):
                counter=curr_freq
                num=i
        return num

    result=[result1, result2, result3, result4, result5]
    finalresult=' '.join([str(elem) for elem in most_frequent(result)])
    print(result, finalresult)
    
    random_roomno=random.randint(1,20)
    request_args = {'req_src_room':str(random_roomno), 'req_message':input, 'req_class':int(finalresult)}
    return doInsertRequest(**request_args)
